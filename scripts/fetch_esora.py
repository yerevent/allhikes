"""Pull upcoming hiking events from Esora's public hiking pages.

    python scripts/fetch_esora.py data/hikes-raw.json

Armenian and Russian names are only fetched for hikes we haven't seen before,
so a daily run stays light on Esora.
"""
import json, os, re, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

UA = {"User-Agent": "Mozilla/5.0 (compatible; allhikes/0.1)"}
BASE = "https://esora.app"
OUT = sys.argv[1]
OLD = {}
if os.path.exists(OUT):
    OLD = {r["slug"]: r for r in json.load(open(OUT, encoding="utf8"))}


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf8")


def ld_event(html):
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        g = json.loads(m.group(1))
        for x in g.get("@graph", [g]):
            if x.get("@type") == "Event":
                return x
    return None


slugs = []
for p in range(1, 10):
    try:
        h = get(f"{BASE}/en/yerevan/hiking?page={p}")
    except Exception:
        break
    found = re.findall(r"https://esora\.app/en/events/([a-z0-9-]+)", h)
    new = [s for s in dict.fromkeys(found) if s not in slugs]
    if not new:
        break
    slugs += new
print("events:", len(slugs))


def num(pat, d):
    m = re.search(pat, d, re.I)
    if not m:
        return None
    try:
        return float(m.group(1).replace(",", "").replace(" ", ""))
    except ValueError:
        return None


def one(slug):
    e = ld_event(get(f"{BASE}/en/events/{slug}"))
    if not e:
        return None
    d = e.get("description") or ""
    org = e.get("organizer") or {}
    ig = next((s for s in org.get("sameAs", []) if "instagram" in s), "")
    loc = e.get("location") or {}
    geo = loc.get("geo") or {}
    off = e.get("offers") or {}
    lines = [l.strip() for l in d.split("\n") if l.strip()]
    names = {"en": e.get("name")}
    prev = (OLD.get(slug) or {}).get("name") or {}
    for lang in ("hy", "ru"):
        if prev.get(lang):
            names[lang] = prev[lang]
            continue
        try:
            x = ld_event(get(f"{BASE}/{lang}/events/{slug}"))
            names[lang] = x.get("name") if x else None
        except Exception:
            names[lang] = None
    return {
        "slug": slug,
        "name": names,
        "start": e.get("startDate"),
        "end": e.get("endDate"),
        "org": (org.get("name") or "").strip() or None,
        "ig": ig.replace("https://www.instagram.com/", "").strip("/"),
        "place": loc.get("name"),
        "lat": geo.get("latitude"),
        "lng": geo.get("longitude"),
        "price": off.get("price"),
        "book": off.get("url"),
        "km": num(r"([\d]+(?:[.,]\d+)?)\s*(?:[-–]\s*[\d.,]+\s*)?km", d),
        "gain": num(r"(?:elevation gain|altitude gain|total ascent|elevation)[^\d\n]{0,25}([\d][\d, ]*)\s*m\b", d),
        "summit": num(r"\((\d[\d,]{2,5})\s*m\)", d),
        "diffText": (re.search(r"difficulty(?: level)?[^\n:]*[:\-–]\s*([^\n.;]{1,30})", d, re.I) or [None, None])[1],
        "back": (re.search(r"return[^\n]{0,40}?(\d{1,2}[:.]\d{2})", d, re.I) or [None, None])[1],
        "meet": (re.search(r"meeting point:\s*([^\n]{1,140})", d, re.I) or [None, None])[1],
        "desc": next((l for l in lines if not l.endswith(":")), "")[:300],
        "esora": f"{BASE}/en/events/{slug}",
    }


with ThreadPoolExecutor(8) as ex:
    rows = [r for r in ex.map(one, slugs) if r]

rows.sort(key=lambda r: r["start"] or "")
if len(rows) < 20:
    sys.exit(f"Only {len(rows)} hikes found; Esora may have changed. Keeping the old file.")
json.dump(rows, open(OUT, "w", encoding="utf8"), ensure_ascii=False, indent=1)
print("saved", len(rows))
