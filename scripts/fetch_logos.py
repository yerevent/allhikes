"""Download each club's logo into assets/logos/<instagram handle>.jpg (160x160).

    python scripts/fetch_logos.py           # only clubs that don't have a logo yet
    python scripts/fetch_logos.py --all     # refresh every logo

Logos come from the club's Esora organiser page, resized by Esora's image service.
Clubs not on Esora need their logo saved by hand (from their Instagram profile picture).
"""
import json, re, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "logos"
OUT.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (compatible; allhikes/0.1)"}
clubs = json.loads((ROOT / "data/clubs.json").read_text(encoding="utf8"))


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return r.read()


for c in clubs:
    dest = OUT / f"{c['ig']}.jpg"
    if dest.exists() and "--all" not in sys.argv:
        continue
    if not c.get("esora_slug"):
        print("no Esora page, add by hand:", c["ig"])
        continue
    html = get(f"https://esora.app/en/organizers/{c['esora_slug']}").decode("utf8")
    m = re.search(r'"logo":"(https://esora\.app/img/unsafe/)[^/]+/([^"]+?)"', html)
    if not m:
        print("no logo on Esora:", c["ig"])
        continue
    rest = re.sub(r"^filters:[^/]*/", "", m.group(2))
    url = f"{m.group(1)}160x160/filters:format(jpeg):quality(82)/{rest}"
    dest.write_bytes(get(url))
    print("saved", dest.name)
