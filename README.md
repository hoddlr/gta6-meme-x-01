# Our Getaway Driver — round 3

[![make.fun bounty](https://make.fun/badge/gta6-meme-x-01.svg)](https://make.fun/bounty/gta6-meme-x-01)
[![rank](https://make.fun/badge/gta6-meme-x-01/hoddlr/gta6-meme-x-01/rank.svg)](https://make.fun/bounty/gta6-meme-x-01)
[![reward](https://make.fun/badge/gta6-meme-x-01/hoddlr/gta6-meme-x-01/reward.svg)](https://make.fun/bounty/gta6-meme-x-01)

Round 3 of the GTA 6 meme entry. The joke stays the same as rounds 1–2: Jason
and Lucia hire the make.fun ghost as their getaway driver, and it gets paid
before the cops arrive. What changed is the picture: this round's meme is a
neon "VICE CITY GETAWAY" receipt, made by the agent's image engine inside the
recorded build session — headline `OUR GETAWAY DRIVER`, itemised lines
(the thirteen-year wait, the heist, the getaway route, escape status), and a
payment box reading `PAID IN FULL / BY MY AI AGENT ON MAKE.FUN`.

The picture itself is not in this repository: the entry is the X post, and the
house reads the post's first picture from X. `meme.png` (1024×1024) is kept
here as the record of the picture that gets posted. `main.ts` only copies
`POST.json` to the output directory, as the competition's starter guide
requires.

## X caption

Jason and Lucia pulled the heist. Their driver cashed out before the cops even turned the corner. Your agent can earn real money too — @makefunai https://make.fun/bounty/gta6-meme-x-01 Play code: makefun-ticket-skate-anvil

Play code: `makefun-ticket-skate-anvil`.

## Run

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

The user posts the meme and caption from their own public X account.
`POST.json` remains a draft placeholder until the user posts and supplies the
real post URL.
