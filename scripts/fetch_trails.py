"""Download hiking trails and named places in Armenia from OpenStreetMap.

    python scripts/fetch_trails.py

Writes:
  data/trails.json  marked hiking routes (route=hiking) with simplified lines
  data/places.json  named peaks, lakes, waterfalls, monasteries, fortresses, gorges, villages
The build matches each hike to a place (for its map pin) and to nearby trails.
Map data © OpenStreetMap contributors, ODbL. Run it every month or two; trails change slowly.
"""
import json, math, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SERVERS = ["https://overpass-api.de/api/interpreter"]
AREA = 'area["ISO3166-1"="AM"][admin_level=2]->.a;'


def overpass(q):
    body = urllib.parse.urlencode({"data": "[out:json][timeout:240];" + AREA + q}).encode()
    for attempt in range(6):
        for url in SERVERS:
            try:
                req = urllib.request.Request(url, data=body, headers={"User-Agent": "allhikes/0.1 (hiking aggregator)"})
                with urllib.request.urlopen(req, timeout=200) as r:
                    return json.loads(r.read().decode("utf8"))["elements"]
            except Exception as e:
                print("  retry:", url, str(e)[:80])
        time.sleep(20 * (attempt + 1))
    sys.exit("OpenStreetMap servers are busy; try again later.")


def names(t):
    out = {}
    for k in ("name", "name:en", "name:hy", "name:ru", "alt_name", "alt_name:en", "old_name"):
        if t.get(k):
            for v in t[k].split(";"):
                out[v.strip()] = 1
    return list(out)


def dist_m(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 6371000 * 2 * math.asin(math.sqrt(h))


def thin(pts, step=60):
    """Keep a point every ~step metres: plenty for a map, a fraction of the size."""
    out = [pts[0]]
    for p in pts[1:]:
        if dist_m(out[-1], p) >= step:
            out.append(p)
    if out[-1] != pts[-1]:
        out.append(pts[-1])
    return [[round(a, 5), round(b, 5)] for a, b in out]


print("Trails...")
# Which trails are in Armenia (a light query), then their shapes in four smaller boxes,
# because one big "everything with shapes" request times out on the public servers.
in_armenia = {e["id"] for e in overpass('relation["route"="hiking"](area.a);out ids;')}
print(" ", len(in_armenia), "trails in Armenia")
rels = {}
for box in ["38.8,43.4,40.05,45.05", "38.8,45.05,40.05,46.7", "40.05,43.4,41.35,45.05", "40.05,45.05,41.35,46.7"]:
    for r in overpass(f'relation["route"="hiking"]({box});out geom;'):
        if r["id"] in in_armenia:
            rels[r["id"]] = r
    print("  box done,", len(rels), "so far")
trails = []
for r in rels.values():
    t = r.get("tags", {})
    lines = []
    for m in r.get("members", []):
        if m.get("type") == "way" and m.get("geometry"):
            pts = [(g["lat"], g["lon"]) for g in m["geometry"]]
            if len(pts) > 1:
                lines.append(thin(pts))
    if not lines:
        continue
    km = sum(dist_m(l[i], l[i + 1]) for l in lines for i in range(len(l) - 1)) / 1000
    allp = [p for l in lines for p in l]
    trails.append({
        "id": r["id"], "names": names(t),
        "name": t.get("name:en") or t.get("name") or "",
        "km": round(km, 1), "network": t.get("network", ""),
        "bbox": [min(p[0] for p in allp), min(p[1] for p in allp), max(p[0] for p in allp), max(p[1] for p in allp)],
        "lines": lines,
    })
print(len(trails), "trails")

print("Places...")
KIND = [("peak", 'node["natural"~"^(peak|volcano)$"]["name"](area.a);'),
        ("water", 'nwr["natural"="water"]["name"](area.a);'),
        ("waterfall", 'nwr["waterway"="waterfall"]["name"](area.a);'),
        ("site", 'nwr["historic"~"^(monastery|castle|fort|fortress|archaeological_site|ruins|church)$"]["name"](area.a);'),
        ("site", 'nwr["building"~"^(church|monastery|chapel)$"]["name"](area.a);'),
        ("valley", 'nwr["natural"~"^(valley|gorge|canyon|cave_entrance|cliff|ridge)$"]["name"](area.a);'),
        ("village", 'node["place"~"^(village|town|hamlet)$"]["name"](area.a);')]
places, seen = [], set()
for kind, q in KIND:
    for e in overpass(q + "out tags center;"):
        lat = e.get("lat") or e.get("center", {}).get("lat")
        lng = e.get("lon") or e.get("center", {}).get("lon")
        if lat is None or (e["type"], e["id"]) in seen:
            continue
        seen.add((e["type"], e["id"]))
        t = e.get("tags", {})
        ele = t.get("ele", "").split(" ")[0].replace(",", ".")
        places.append({"k": kind, "n": names(t), "lat": round(lat, 5), "lng": round(lng, 5),
                       "ele": float(ele) if ele.replace(".", "", 1).isdigit() else None})
    print(" ", kind, len(places))

(ROOT / "data/trails.json").write_text(json.dumps(trails, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
(ROOT / "data/places.json").write_text(json.dumps(places, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
print("saved", len(trails), "trails and", len(places), "places")
