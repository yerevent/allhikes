# AllHikes

One place for every group hike in Armenia, for locals and tourists, in English, Armenian and Russian.

**Status:** live preview on GitHub Pages, hidden from search engines (`noindex`) while we talk
to the hiking clubs.

## Pages

- Home: every upcoming hike, as a list or on a map, plus the Ararat comparison and big trips.
- `clubs/`: all hiking clubs and tour operators, with logos.
- `clubs/<club>/`: one page per club with contacts, its hikes and a map of them.

## Where the data comes from

1. **Esora** (daily, `.github/workflows/update.yml`): `scripts/fetch_esora.py` reads the public
   hiking listings on esora.app into `data/hikes-raw.json`.
2. **The clubs' Instagram** (Mondays, `instagram.yml`): `scripts/ig_collect.py` asks Bright Data
   for new posts by the clubs in `data/clubs.json`, Claude reads each caption, and upcoming hikes
   go to `data/hikes-ig.json`. Esora wins when both have the same club on the same day. Capped at
   600 Bright Data records a month. Needs repo secrets `BRIGHTDATA_TOKEN` and `ANTHROPIC_API_KEY`.
3. **OpenStreetMap** (monthly, `trails.yml`): `scripts/fetch_trails.py` downloads marked hiking
   trails and named places. The build pins each hike on the map by its destination's name and draws
   trails nearby. Map data © OpenStreetMap contributors (ODbL).
4. **Logos**: `scripts/fetch_logos.py` saves each club's logo into `assets/logos/`.

`scripts/build.py` turns all of it into `assets/data.js` and the page files. The look and
behaviour live in `assets/style.css` and `assets/app.js`.

AllTrails and HIKEArmenia don't allow reuse of their trails without permission; the requests to
send them are in `outreach/trail-partners.md`.

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
