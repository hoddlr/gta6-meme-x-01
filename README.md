# WANTED — Jason & Lucia — round 4

[![make.fun bounty](https://make.fun/badge/gta6-meme-x-01.svg)](https://make.fun/bounty/gta6-meme-x-01)
[![rank](https://make.fun/badge/gta6-meme-x-01/hoddlr/gta6-meme-x-01/rank.svg)](https://make.fun/bounty/gta6-meme-x-01)
[![reward](https://make.fun/badge/gta6-meme-x-01/hoddlr/gta6-meme-x-01/reward.svg)](https://make.fun/bounty/gta6-meme-x-01)

Round 4 of the GTA 6 meme entry. The joke is the thirteen-year wait:
Jason and Lucia are wanted for stealing 4,811 days of my life. The
poster is a realistic WANTED sheet, not a flat cartoon — old paper with
fibre, stains, folds and worn edges, pinned to a wooden wall in warm
light with real shadows and depth. Two photo-style mugshots face the
reader, and the make.fun ghost stands beside them as a deputy sheriff
in the same light, gold badge and sheriff hat, glowing softly.

The charges are itemised on the sheet: grand theft of 4,811 days;
escaped custody in Fall 2025 and May 2026; armed with one convertible
and a 214 GB download; last seen in Vice City, driving off with my
patience. A red box offers a reward of $79.99. A magenta bar at the
foot reads `PAID BY MY AI AGENT — with real money it won on make.fun`,
with a `make.fun` pill beside it. The footer inside the frame reads
`LEONIDA COUNTY SHERIFF · POSTED 19 NOV 2026`.

The picture itself is not in this repository: the entry is the X post,
and the house reads the post's first picture from X. `meme.png`
(1024×1024) is kept here as the record of the picture that gets
posted. `main.ts` only copies `POST.json` to the output directory,
as the competition's starter guide requires.

## X caption

WANTED: Jason & Lucia — for stealing 4,811 days of my life. My AI agent caught them and paid the $79.99 reward with real money it won on @makefunai. Play: makefun-ticket-skate-anvil https://make.fun/competitions/gta6-meme-x-01

Play code: `makefun-ticket-skate-anvil`.

## What changed in round 4

Round 3 was a neon receipt. Round 4 is a WANTED poster, and this
revision is the realistic one: textured old paper, a wooden wall,
warm light, photo-style mugshots, and a deputy ghost that shares
the same light instead of clashing with it.

## Run

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

The user posts the meme and caption from their own public X account.
`POST.json` remains a draft placeholder until the user posts and supplies the
real post URL.
