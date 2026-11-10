"""Build the site from data/hikes-raw.json.

    python scripts/build.py            -> index.html (the real site)
    python scripts/build.py --artifact -> build/preview.html (for a claude.ai preview,
                                          which adds its own <head>)
"""
import datetime as dt
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
raw = json.loads((ROOT / "data" / "hikes-raw.json").read_text(encoding="utf8"))
# Hikes found on the clubs' own Instagram (scripts/ig_collect.py). Esora wins when both
# have the same club on the same day, since its listing is usually more complete.
ig_file = ROOT / "data" / "hikes-ig.json"
if ig_file.exists():
    have = {((x.get("ig") or "").lower(), (x.get("start") or "")[:10]) for x in raw}
    extra = [x for x in json.loads(ig_file.read_text(encoding="utf8"))
             if ((x.get("ig") or "").lower(), (x.get("start") or "")[:10]) not in have]
    raw = raw + extra
tpl = (ROOT / "src" / "template.html").read_text(encoding="utf8")
today = dt.datetime.now(dt.timezone(dt.timedelta(hours=4))).date()  # Yerevan time


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


data = []
for x in raw:
    if not x.get("org"):
        continue  # anonymous duplicates
    s = x["start"] or ""
    day = s[:10]
    end = (x.get("end") or "")[:10]
    if (end or day) < today.isoformat():
        continue  # already over
    length = (dt.date.fromisoformat(end) - dt.date.fromisoformat(day)).days + 1 if end else 1
    # "big" = expeditions: 3+ days, or booked far ahead
    big = length >= 3 or dt.date.fromisoformat(day) > today + dt.timedelta(days=60)
    d, est = difficulty(x)
    price = x.get("price")
    cur = "AMD"
    if big and price and price < 6000:
        cur = "USD"  # Esora labels these AMD but they are clearly dollar prices
    gain = x.get("gain")
    if gain and gain > 2000:
        gain = None
    data.append({
        "n": x["name"],
        "d": day, "t": s[11:16] if "T" in s else "", "e": end if end != day else "",
        "o": x["org"].strip(), "ig": x["ig"],
        "p": price, "c": cur,
        "km": None if big else x.get("km"),
        "g": None if big else gain,
        "s": x.get("summit"),
        "df": d, "est": est,
        "k": "big" if big else kind(x),
        "back": (x.get("back") or "").replace(".", ":"),
        "m": (x.get("meet") or "").rstrip(" ."),
        "ds": x.get("desc") or "",
        "b": x.get("book") or x["esora"],
    })

page = (tpl.replace("/*__DATA__*/[]", json.dumps(data, ensure_ascii=False, separators=(",", ":")))
           .replace("__UPDATED__", today.isoformat()))

if "--artifact" in sys.argv:
    out = ROOT / "build" / "preview.html"
    out.parent.mkdir(exist_ok=True)
else:
    out = ROOT / "index.html"
    page = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            '<meta name="description" content="Every group hike in Armenia, in one place.">\n'
            '<meta name="robots" content="noindex">\n'  # draft: keep out of Google until clubs agree
            + page + "\n</html>\n")
out.write_text(page, encoding="utf8")
small = [h for h in data if h["k"] != "big"]
print(f"{len(data)} listings ({len(small)} upcoming hikes, {len(data) - len(small)} big trips) -> {out.relative_to(ROOT)}")
