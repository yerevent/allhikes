# Arahet

One place for every group hike in Armenia, for locals and tourists, in English, Armenian and Russian.
"Arahet" (Արահետ, "trail") is a working name.

**Status:** draft. The site is not public yet: we're talking to hiking clubs first.

## How it works

1. `scripts/fetch_esora.py` reads the public hiking listings on esora.app into `data/hikes-raw.json`.
2. `scripts/build.py` turns that into `index.html` (the whole site, data included).
3. A GitHub Action (`.github/workflows/update.yml`) runs both every morning at 07:00 Yerevan time
   and saves the result. You can also run it by hand from the **Actions** tab ("Run workflow").

Booking always happens with the club: every "Book" button links to the club's own post or website.

## Run it on your computer

```bash
python scripts/fetch_esora.py data/hikes-raw.json
python scripts/build.py
python -m http.server 8767
```

Then open http://localhost:8767.
