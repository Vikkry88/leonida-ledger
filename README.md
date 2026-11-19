[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Vikkry88/leonida-ledger/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Vikkry88/leonida-ledger/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Ledger — GTA VI Trophy Guide & Tracker

An offline trophy guide and progress tracker for all 55 PlayStation 5 trophies of
Grand Theft Auto VI. It is a static web app: open `app/index.html` in a desktop
browser (or serve `app/` with any static file server) and everything runs from
the files in this repository — no network, no account, no build step.

## What it does

- **Full official list** — every trophy with its official name, description and
  grade (1 platinum, 2 gold, 6 silver, 46 bronze), including the 28 trophies
  PlayStation keeps hidden until earned.
- **A guide for each trophy**, written for this project in plain words: what to
  do, where to start, tips, and whether it can be missed. Each guide names the
  sources its facts came from (Exophase and PSNProfiles for the official list,
  plus community guides checked at launch).
- **Tracker** — tick trophies off as you earn them; counted trophies (250
  stunts, 100 WAiNK spots, $250,000 laundered…) have progress counters you can
  nudge up and down. Progress is saved in your browser's localStorage.
- **Export / import** — download your progress as a JSON file and load it back
  on any machine, or keep it as a backup.
- **Search & filters** — find a trophy by name, or filter by grade, kind
  (story, strangers, activities, collectibles, crimes, exploration, money),
  earned/missing status, hidden, and missable.
- **Spoiler shield** — hide the names and descriptions of story trophies until
  you earn them, so the guide never spoils the plot.
- **Platinum roadmap** — a staged plan from the first mission to 100%
  completion, with per-stage progress.
- **Missables watch** — the trophies you can lose, why, and the save habit that
  protects you (GTA VI has no mission replay).

## How to run

```sh
node serve.ts        # then open http://localhost:8080
```

Or open `app/index.html` directly in Chrome. Everything works with the network
off; source links in the guides only open if you click them.

## Layout

- `app/` — the guide itself: `index.html`, `style.css`, `app.js`, and
  `data/trophies.json` (the 55 trophies with their guides).
- `main.ts` — hands the guide in: copies `app/` and `screenshots/` to the
  output folder and writes `dossier.json` with `vendor/makefun-frontend.ts`.
- `screenshots/` — renders of the guide for the make.fun dossier.

Licensed under the MIT License (see `LICENSE`). Trophy names and descriptions
are as PlayStation publishes them; all guide text is original to this project.
No Rockstar artwork or logos are used — the look is our own.

Built for make.fun competition **gta6-trophy-guide-01** ("Build the best GTA 6
trophy guide"). Screenshots of the guide live in `screenshots/`; the first by
name is the cover shown in the dossier.
