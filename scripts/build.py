"""Build the site.

    python scripts/build.py

Reads  data/hikes-raw.json (Esora), data/hikes-ig.json (Instagram), data/clubs.json,
       data/trails.json + data/places.json (OpenStreetMap, from scripts/fetch_trails.py)
Writes assets/data.js      everything the pages show (window.AH)
       index.html          home: upcoming hikes, list + map
       clubs/index.html    all clubs
       clubs/<slug>/index.html   one page per club
The look and behaviour live in assets/style.css and assets/app.js (edit those directly).
"""
import datetime as dt
import html, json, math, re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
D = ROOT / "data"
load = lambda n, default=None: json.loads((D / n).read_text(encoding="utf8")) if (D / n).exists() else default
today = dt.datetime.now(dt.timezone(dt.timedelta(hours=4))).date()  # Yerevan time
SITE_NAME = "AllHikes"

raw = load("hikes-raw.json", [])
# Hikes found on the clubs' own Instagram (scripts/ig_collect.py). Esora wins when both
# have the same club on the same day, since its listing is usually more complete.
have = {((x.get("ig") or "").lower(), (x.get("start") or "")[:10]) for x in raw}
raw += [x for x in load("hikes-ig.json", [])
        if ((x.get("ig") or "").lower(), (x.get("start") or "")[:10]) not in have]

clubs = [c for c in load("clubs.json", []) if c.get("active")]
slug_of = lambda ig: re.sub(r"[^a-z0-9]+", "-", ig.lower()).strip("-")
club_by_ig = {c["ig"].lower(): c for c in clubs}


# ---------- hike fields ----------
def difficulty(x):
    t = (x.get("diffText") or "").lower()
    if re.search(r"above average|hard|difficult|challenging|good physi", t):
        return "hard", False
    if re.search(r"easy|light|beginner", t):
        return "easy", False
    if re.search(r"moderate|medium|average|[4-6]/10", t):
        return "moderate", False
    km, gain = x.get("km") or 0, x.get("gain") or 0
    if gain > 2000:  # caught a summit height, not a gain
        gain = 0
    if gain >= 1000 or km >= 17:
        return "hard", True
    if gain >= 500 or km >= 11:
        return "moderate", True
    if km or gain:
        return "easy", True
    return "", False


def kind(x):
    n = x["name"]["en"].lower()
    if "kid" in n:
        return "kids"
    if " run" in " " + n:
        return "run"
    if "rope" in n:
        return "adventure"
    if "herouni" in n or "ski" in n:
        return "trip"
    return "hike"


# ---------- where does each hike go? (OpenStreetMap places + trails) ----------
places, trails = load("places.json", []), load("trails.json", [])
GENERIC = {"peak": r"\b(mount|mountain|mt|peak|summit|гора|вершина|лер)\b|լեռ(ը|ան)?|գագաթ",
           "water": r"\b(lake|lakes|озеро|озёра)\b|լիճ|լճակ",
           "waterfall": r"\b(waterfall|waterfalls|водопад)\b|ջրվեժ",
           "site": r"\b(monastery|church|fortress|fort|castle|монастырь|церковь|крепость)\b|վանք|եկեղեցի|ամրոց|բերդ",
           "valley": r"\b(gorge|canyon|valley|cave|ущелье|каньон|пещера)\b|կիրճ|ձոր|քարանձավ",
           "village": r"(?!)"}
BONUS = {"peak": 6, "water": 5, "waterfall": 5, "site": 4, "valley": 4, "village": 0}
STOP = {"armenia", "yerevan", "hayastan", "ереван", "армения", "երևան", "հայաստան", "lake", "mount", "river",
        # everyday words that are also place names ("Three Lakes", the village "Vank" = monastery)
        "three", "two", "big", "small", "white", "black", "red", "green", "blue", "long", "old", "new",
        "upper", "lower", "great", "little", "sunset", "autumn", "hike", "hiking", "trail", "kids", "saint",
        "holy", "vank", "berd", "kar", "sar", "dzor", "gyugh", "aghbyur", "forest", "canyon", "gorge"}


def norm(s):
    s = (s or "").lower().replace("ё", "е").replace("’", "").replace("'", "")
    return " " + re.sub(r"[^\w]+", " ", s).strip() + " "


def dist_km(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 12742 * math.asin(math.sqrt(h))


# every searchable form of every place name: the full name, and the name without "Mount"/"Lake"/...
index = []
for p in places:
    for n in p["n"]:
        full = norm(n).strip()
        if len(full) >= (5 if p["k"] == "village" else 4) and full not in STOP:
            index.append((full, p, False))
        core = re.sub(r"\s+", " ", re.sub(GENERIC[p["k"]], " ", full)).strip()
        if core != full and len(core) >= 3 and core not in STOP:
            index.append((core, p, True))


def near_trails(pt, max_km=2.5, limit=3):
    out = []
    for tr in trails:
        b = tr["bbox"]
        if not (b[0] - .03 <= pt[0] <= b[2] + .03 and b[1] - .04 <= pt[1] <= b[3] + .04):
            continue
        d = min(dist_km(pt, q) for line in tr["lines"] for q in line)
        if d <= max_km:
            out.append((d, tr["id"]))
    return [i for _, i in sorted(out)[:limit]]


def locate(x):
    text = norm(" ".join(filter(None, [x["name"].get("en"), x["name"].get("ru"), x["name"].get("hy")])))
    best = None
    for form, p, is_core in index:
        if f" {form} " not in text:
            continue
        if is_core and len(form) < 5:
            # short bare names ("ara") only count next to a word like "mount"/"lake"
            if not re.search(rf"({GENERIC[p['k']]})\s+(of\s+)?{re.escape(form)}\b|\b{re.escape(form)}\s+({GENERIC[p['k']]})", text):
                continue
        score = len(form) + BONUS[p["k"]] + (2 if near_trails((p["lat"], p["lng"]), 3, 1) else 0) + (p.get("ele") or 0) / 5000
        if not best or score > best[0]:
            best = (score, p)
    tr_named = []
    for tr in trails:  # a trail named in the hike ("Three Hawks Trail")
        core = re.sub(r"\b(trail|loop|path|тропа)\b", " ", norm(tr["name"])).strip()
        if len(core) >= 7 and f" {core} " in text:
            tr_named.append(tr["id"])
    if best:
        p = best[1]
        pt = (p["lat"], p["lng"])
        trs = list(dict.fromkeys(tr_named + near_trails(pt)))[:3]
        label = next((n for n in p["n"] if re.search(r"[a-z]", n.lower())), p["n"][0])
        return [p["lat"], p["lng"], label, p["k"]], trs
    if tr_named:
        tr = next(t for t in trails if t["id"] == tr_named[0])
        mid = tr["lines"][0][len(tr["lines"][0]) // 2]
        return [mid[0], mid[1], tr["name"], "trail"], tr_named[:3]
    return None, []


# ---------- hikes ----------
data, used_trails = [], set()
for x in raw:
    if not x.get("org"):
        continue
    s = x["start"] or ""
    day, end = s[:10], (x.get("end") or "")[:10]
    if (end or day) < today.isoformat():
        continue
    length = (dt.date.fromisoformat(end) - dt.date.fromisoformat(day)).days + 1 if end else 1
    big = length >= 3 or dt.date.fromisoformat(day) > today + dt.timedelta(days=60)
    d, est = difficulty(x)
    price, cur = x.get("price"), "AMD"
    if big and price and price < 6000:
        cur = "USD"  # Esora labels these AMD but they are clearly dollar prices
    gain = x.get("gain")
    if gain and gain > 2000:
        gain = None
    loc, trs = (None, []) if big else locate(x)
    used_trails.update(trs)
    club = club_by_ig.get((x.get("ig") or "").lower())
    data.append({
        "n": x["name"], "d": day, "t": s[11:16] if "T" in s else "", "e": end if end != day else "",
        "o": (club or {}).get("name") or x["org"].strip(), "cs": slug_of(club["ig"]) if club else "",
        "p": price, "c": cur,
        "km": None if big else x.get("km"), "g": None if big else gain, "s": x.get("summit"),
        "df": d, "est": est, "k": "big" if big else kind(x),
        "back": (x.get("back") or "").replace(".", ":"), "m": (x.get("meet") or "").rstrip(" ."),
        "ds": x.get("desc") or "", "b": x.get("book") or x["esora"],
        "loc": loc, "tr": trs,
    })

pub_clubs = []
for c in clubs:
    s = slug_of(c["ig"])
    f = (c.get("followers") or "0").replace(",", "")
    pub_clubs.append({
        "slug": s, "ig": c["ig"], "name": c["name"], "type": c["type"], "followers": c["followers"],
        "fn": float(f[:-1]) * 1000 if f.endswith("K") else float(f),
        "up": sum(1 for h in data if h["cs"] == s and h["k"] != "big"),
        "phone": c.get("phone", []), "telegram": c.get("telegram", []), "whatsapp": c.get("whatsapp", ""),
        "email": c.get("email", ""), "web": c.get("web", ""),
    })
trail_out = {t["id"]: {"name": t["name"], "km": t["km"], "lines": t["lines"]} for t in trails if t["id"] in used_trails}

(ROOT / "assets").mkdir(exist_ok=True)
(ROOT / "assets/data.js").write_text(
    "window.AH=" + json.dumps({"updated": today.isoformat(), "hikes": data, "clubs": pub_clubs, "trails": trail_out},
                              ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf8")


# ---------- page shells ----------
def page(path, root, title, desc, body_attrs):
    v = today.strftime("%Y%m%d")
    out = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<meta name="robots" content="noindex">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:type" content="website">
<link rel="icon" href="{root}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Golos+Text:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&family=Noto+Sans+Armenian:wdth,wght@75..100,400..700&display=swap">
<link rel="stylesheet" href="{root}assets/style.css?v={v}">
</head>
<body {body_attrs} data-root="{root}">
<noscript><p style="padding:16px">AllHikes needs JavaScript to show the hikes.</p></noscript>
<script src="{root}assets/data.js?v={v}"></script>
<script src="{root}assets/app.js?v={v}"></script>
</body>
</html>
"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(out, encoding="utf8")


n_up = sum(1 for h in data if h["k"] != "big")
page(ROOT / "index.html", "./", f"{SITE_NAME} · Every group hike in Armenia",
     f"{n_up} upcoming group hikes from {len(pub_clubs)} Armenian hiking clubs, in English, Armenian and Russian.", 'data-page="home"')
page(ROOT / "clubs/index.html", "../", f"Hiking clubs in Armenia · {SITE_NAME}",
     f"All {len(pub_clubs)} hiking clubs and tour operators in Armenia, with their upcoming hikes.", 'data-page="clubs"')
keep = set()
for c in pub_clubs:
    keep.add(c["slug"])
    page(ROOT / "clubs" / c["slug"] / "index.html", "../../", f"{c['name']} · {SITE_NAME}",
         f"Upcoming hikes by {c['name']} and how to book them.", f'data-page="club" data-club="{c["slug"]}"')
for d in (ROOT / "clubs").iterdir():  # clubs that were removed from clubs.json
    if d.is_dir() and d.name not in keep:
        shutil.rmtree(d)

located = sum(1 for h in data if h["loc"])
print(f"{len(data)} listings ({n_up} upcoming hikes), {len(pub_clubs)} club pages, "
      f"{located} hikes on the map, {len(trail_out)} trails drawn")
