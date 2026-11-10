"""Weekly Instagram collector: new posts from the clubs -> hike listings.

    python scripts/ig_collect.py            # real run
    python scripts/ig_collect.py --dry      # show what would be asked for, spend nothing

1. Bright Data (same Instagram-posts dataset as yerevent) fetches the last
   LOOKBACK_DAYS of posts for every active club in data/clubs.json.
2. Claude reads each new caption and pulls out any upcoming hikes.
3. Results go to data/hikes-ig.json; scripts/build.py merges them with Esora.

Needs two secrets (GitHub repo Settings -> Secrets -> Actions):
    BRIGHTDATA_TOKEN    Bright Data API token
    ANTHROPIC_API_KEY   Claude API key
Spending guard: stops before asking Bright Data for more once this calendar
month's records reach BD_MONTHLY_CAP (shared Bright Data account with yerevent).
"""
import datetime as dt
import json, os, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
DATASET = "gd_lk5ns7kz21pck8jpis"  # Instagram posts, discover by profile URL
LOOKBACK_DAYS = 8                   # weekly run + one day overlap
BD_MONTHLY_CAP = int(os.environ.get("BD_MONTHLY_CAP", "600"))
MODEL = "claude-opus-5-5"
DRY = "--dry" in sys.argv
today = dt.datetime.now(dt.timezone(dt.timedelta(hours=4))).date()


def load(name, default):
    p = DATA / name
    return json.loads(p.read_text(encoding="utf8")) if p.exists() else default


def save(name, obj):
    (DATA / name).write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding="utf8")


clubs = [c for c in load("clubs.json", []) if c.get("active")]
seen = load("ig-posts.json", {})        # post url -> {handle, date, status, n}
usage = load("brightdata-usage.json", {})
month = today.strftime("%Y-%m")

print(f"{len(clubs)} clubs, {usage.get(month, 0)} of {BD_MONTHLY_CAP} Bright Data records used in {month}")
if DRY:
    print("Dry run. Would ask Bright Data for posts since", today - dt.timedelta(days=LOOKBACK_DAYS))
    sys.exit(0)
if usage.get(month, 0) >= BD_MONTHLY_CAP:
    sys.exit(f"Stopped: this month's Bright Data cap ({BD_MONTHLY_CAP}) is reached. Raise BD_MONTHLY_CAP to continue.")
BD = os.environ.get("BRIGHTDATA_TOKEN")
if not BD or not os.environ.get("ANTHROPIC_API_KEY"):
    sys.exit("Missing BRIGHTDATA_TOKEN or ANTHROPIC_API_KEY. Add them as GitHub secrets.")


# ---------- 1. Bright Data ----------
def bd(method, path, body=None):
    req = urllib.request.Request(
        "https://api.brightdata.com/datasets/v3/" + path, method=method,
        data=None if body is None else json.dumps(body).encode(),
        headers={"Authorization": "Bearer " + BD, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode("utf8") or "null")


start = (today - dt.timedelta(days=LOOKBACK_DAYS)).strftime("%m-%d-%Y")
inputs = [{"url": f"https://www.instagram.com/{c['ig']}/", "start_date": start,
           "end_date": today.strftime("%m-%d-%Y")} for c in clubs]
q = urllib.parse.urlencode({"dataset_id": DATASET, "include_errors": "true",
                            "type": "discover_new", "discover_by": "url"})
snap = bd("POST", "trigger?" + q, inputs)["snapshot_id"]
print("Bright Data snapshot", snap)
for _ in range(90):  # up to 30 minutes
    time.sleep(20)
    status = bd("GET", f"progress/{snap}").get("status")
    if status == "ready":
        break
    if status == "failed":
        sys.exit("Bright Data says the collection failed.")
else:
    sys.exit("Bright Data took longer than 30 minutes; try again later.")
posts = bd("GET", f"snapshot/{snap}?format=json") or []
usage[month] = usage.get(month, 0) + len(posts)
save("brightdata-usage.json", usage)
print(f"{len(posts)} records downloaded ({usage[month]} this month)")


# ---------- 2. Claude reads each new caption ----------
import anthropic  # noqa: E402  (installed by the workflow)

client = anthropic.Anthropic()
SYSTEM = """You read Instagram posts by Armenian hiking clubs and tour operators and pull out
upcoming group hikes, treks and outdoor trips that people can sign up for.

Rules:
- Only trips with a specific date. Skip recaps of past trips, gear sales, giveaways,
  general ads and posts with no date.
- One entry per trip and date. If a post lists several trips, return each.
- Work out the year from the post date (a trip is never before the post date).
- Leave a field empty ("" or 0) when the post doesn't say. Never guess prices or numbers.
- name_en / name_hy / name_ru: a short trip name in each language, e.g. "Ascent of Mount Ara".
- description_en: one or two plain English sentences about the trip.
- difficulty: "easy", "moderate" or "hard" only if the post says so, else "".
- price_amd: price per person in AMD. If it is in another currency, put 0 and mention it in description_en."""

S = lambda: {"type": "string"}
N = lambda: {"type": "number"}
SCHEMA = {
    "type": "object", "additionalProperties": False, "required": ["hikes"],
    "properties": {"hikes": {"type": "array", "items": {
        "type": "object", "additionalProperties": False,
        "required": ["name_en", "name_hy", "name_ru", "date", "end_date", "start_time", "return_time",
                     "price_amd", "km", "elevation_gain_m", "summit_m", "difficulty",
                     "meeting_point", "description_en"],
        "properties": {
            "name_en": S(), "name_hy": S(), "name_ru": S(),
            "date": {"type": "string", "description": "YYYY-MM-DD"},
            "end_date": {"type": "string", "description": "YYYY-MM-DD for multi-day trips, else empty"},
            "start_time": {"type": "string", "description": "HH:MM 24h, else empty"},
            "return_time": {"type": "string", "description": "HH:MM 24h, else empty"},
            "price_amd": N(), "km": N(), "elevation_gain_m": N(), "summit_m": N(),
            "difficulty": {"type": "string", "enum": ["", "easy", "moderate", "hard"]},
            "meeting_point": S(), "description_en": S(),
        }}}},
}


def extract(club, post_date, caption):
    req = dict(
        model=MODEL, max_tokens=4000, system=SYSTEM,
        output_config={"effort": "low", "format": {"type": "json_schema", "schema": SCHEMA}},
        messages=[{"role": "user", "content":
                   f"Club: {club}\nPost date: {post_date}\n\nCaption:\n{caption}"}],
    )
    try:  # opt-in refusal fallback; plain request if the beta isn't accepted
        r = client.beta.messages.create(betas=["server-side-fallback-2026-07-01"], fallbacks="default", **req)
    except (anthropic.BadRequestError, TypeError):
        r = client.messages.create(**req)
    if r.stop_reason in ("refusal", "max_tokens"):
        return None
    text = next((b.text for b in r.content if b.type == "text"), "")
    return json.loads(text).get("hikes", [])


by_handle = {c["ig"].lower(): c for c in clubs}
found = load("hikes-ig.json", [])
new_hikes = 0
for p in posts:
    url = (p.get("url") or "").split("?")[0]
    handle = (p.get("user_posted") or "").lower()
    caption = p.get("description") or p.get("caption") or ""
    if not url or url in seen or handle not in by_handle:
        continue
    posted = (p.get("date_posted") or "")[:10]
    club = by_handle[handle]
    entry = {"handle": handle, "date": posted, "status": "no caption", "n": 0}
    if caption.strip():
        try:
            hikes = extract(club["name"], posted, caption)
        except anthropic.APIError as e:
            print("Claude error on", url, e)
            continue  # not marked seen, retried next week
        if hikes is None:
            entry["status"] = "skipped"
        else:
            entry["status"] = "hikes" if hikes else "not a hike"
            for i, h in enumerate(hikes):
                if not h["date"] or h["date"] < today.isoformat():
                    continue
                start = h["date"] + ("T" + h["start_time"] + ":00+04:00" if h["start_time"] else "")
                found.append({
                    "slug": f"ig-{url.rstrip('/').split('/')[-1]}-{i}", "source": "instagram",
                    "name": {"en": h["name_en"], "hy": h["name_hy"] or None, "ru": h["name_ru"] or None},
                    "start": start, "end": h["end_date"] or None,
                    "org": club["name"], "ig": club["ig"], "place": None, "lat": None, "lng": None,
                    "price": int(h["price_amd"]) or None, "book": url,
                    "km": h["km"] or None, "gain": h["elevation_gain_m"] or None, "summit": h["summit_m"] or None,
                    "diffText": h["difficulty"] or None, "back": h["return_time"] or None,
                    "meet": h["meeting_point"] or None, "desc": h["description_en"], "esora": url,
                })
                entry["n"] += 1
                new_hikes += 1
    seen[url] = entry

# keep only hikes that haven't happened yet
found = [h for h in found if (h["end"] or h["start"][:10]) >= today.isoformat()]
save("hikes-ig.json", found)
save("ig-posts.json", seen)
print(f"{new_hikes} new hikes from Instagram; {len(found)} upcoming in total")
