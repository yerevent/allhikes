# Arahet

One place for every group hike in Armenia, for locals and tourists, in English, Armenian and Russian.
"Arahet" (Արահետ, "trail") is a working name.

**Status:** draft. The site is not public yet: we're talking to hiking clubs first.

## How it works

1. `scripts/fetch_esora.py` reads the public hiking listings on esora.app into `data/hikes-raw.json`.
2. `scripts/build.py` turns that into `index.html` (the whole site, data included).
3. A GitHub Action (`.github/workflows/update.yml`) runs both every morning at 07:00 Yerevan time
   and saves the result. You can also run it by hand from the **Actions** tab ("Run workflow").

4. A second GitHub Action (`.github/workflows/instagram.yml`) runs every Monday: `scripts/ig_collect.py`
   asks Bright Data for the clubs' new Instagram posts (clubs listed in `data/clubs.json`), Claude reads
   each caption and saves any upcoming hikes to `data/hikes-ig.json`. The build adds those hikes when
   Esora doesn't already have that club on that day. It stops itself once Bright Data use for the month
   reaches 600 records (`data/brightdata-usage.json`). It needs two repo secrets: `BRIGHTDATA_TOKEN`
   and `ANTHROPIC_API_KEY`.

## Partner outreach

`data/clubs.json` lists every company with its contacts. `outreach/letters.json` has the partner
letter (short message and email, in EN/RU/HY). `python scripts/outreach.py` makes
`outreach/contacts.csv` (opens in Excel or Google Sheets) and a private outreach page in `build/`.

Booking always happens with the club: every "Book" button links to the club's own post or website.

## Run it on your computer

```bash
python scripts/fetch_esora.py data/hikes-raw.json
python scripts/build.py
python -m http.server 8767
```

Then open http://localhost:8767.
