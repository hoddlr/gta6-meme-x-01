// gta6-meme-x-01 round 3 — "Our Getaway Driver" (engine-made receipt meme).
// The entry program only hands POST.json to the grader: the meme picture
// itself lives on the X post named in POST.json, not in this repository.
// Node 22, stdlib only, no network, no files outside the repository.

import fs from 'node:fs';
import path from 'node:path';

const botDir = process.env.MAKEFUN_BOT_DIR ?? '.';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? 'out';

const source = path.join(botDir, 'POST.json');
const target = path.join(outputDir, 'POST.json');

fs.mkdirSync(outputDir, { recursive: true });

// Fail loudly on a malformed POST.json instead of handing the grader a broken file.
JSON.parse(fs.readFileSync(source, 'utf8'));

fs.copyFileSync(source, target);
