"""Make the partner outreach kit from data/clubs.json, the hike data and outreach/letters.json.

    python scripts/outreach.py   -> outreach/contacts.csv and build/outreach.html (private preview page)
"""
import csv, datetime as dt, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
clubs = json.loads((ROOT / "data/clubs.json").read_text(encoding="utf8"))
letters = json.loads((ROOT / "outreach/letters.json").read_text(encoding="utf8"))
hikes = json.loads((ROOT / "data/hikes-raw.json").read_text(encoding="utf8"))
igf = ROOT / "data/hikes-ig.json"
if igf.exists():
    hikes += json.loads(igf.read_text(encoding="utf8"))
today = dt.datetime.now(dt.timezone(dt.timedelta(hours=4))).date().isoformat()


def followers(s):
    s = (s or "0").replace(",", "")
    return float(s[:-1]) * 1000 if s.endswith("K") else float(s)


rows = []
for c in clubs:
    mine = sorted((h for h in hikes if (h.get("ig") or "").lower() == c["ig"].lower()
                   and (h.get("end") or h.get("start") or "")[:10] >= today), key=lambda h: h["start"])
    ex = mine[0]["name"] if mine else {}
    rows.append({**c, "upcoming": len(mine),
                 "example": {k: (ex.get(k) or ex.get("en") or "") for k in ("en", "ru", "hy")},
                 "next": mine[0]["start"][:10] if mine else ""})
rows.sort(key=lambda r: (-r["upcoming"], -followers(r["followers"])))

with open(ROOT / "outreach/contacts.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(["Club", "Instagram", "Type", "Followers", "Upcoming hikes", "Language",
                "Phone", "Telegram", "WhatsApp", "Email", "Website", "Status", "Notes"])
    for r in rows:
        w.writerow([r["name"], "@" + r["ig"], r["type"], r["followers"], r["upcoming"], r["lang"],
                    " / ".join(r["phone"]), " ".join(r["telegram"]), r["whatsapp"], r["email"], r["web"], "", ""])

page = (ROOT / "src/outreach-template.html").read_text(encoding="utf8")
page = page.replace("/*__CLUBS__*/[]", json.dumps(rows, ensure_ascii=False)).replace(
    "/*__LETTERS__*/{}", json.dumps(letters, ensure_ascii=False))
(ROOT / "build").mkdir(exist_ok=True)
(ROOT / "build/outreach.html").write_text(page, encoding="utf8")
print(len(rows), "clubs ->", "outreach/contacts.csv, build/outreach.html")
