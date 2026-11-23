// gta6-meme-x-01 — round 4 v2, "WANTED: Jason & Lucia" (realistic poster).
//
// This entry's only deliverable is POST.json: a pointer to the X post
// whose first picture is the round 4 meme. The poster image itself is
// NOT shipped in this repo — the house reads it from the post — so this
// program does one small, checked job: validate the pointer, then copy
// it into the output directory the harness gave us.
//
// Node 22, standard library only. No network, no writes outside the
// output directory, no reads besides POST.json.

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const botDir = process.env.MAKEFUN_BOT_DIR ?? '.';
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? 'out';

const source = join(botDir, 'POST.json');
const target = join(outDir, 'POST.json');

const text = readFileSync(source, 'utf8');
const post = JSON.parse(text);

// A stale or hand-edited pointer must never reach the grader
// silently: if the URL is not an x.com post, we stop here, before
// any file is written, so a bad pointer can never be submitted.
// (Round 4 v2 note: POST.json is still the placeholder — the owner
// posts the new poster from X first, then this pointer is updated.)

const keys = Object.keys(post);
const singleUrl =
  post !== null &&
  typeof post === 'object' &&
  !Array.isArray(post) &&
  keys.length === 1 &&
  keys[0] === 'url' &&
  typeof post.url === 'string' &&
  post.url.startsWith('https://x.com/');

if (!singleUrl) {
  throw new Error('POST.json must hold exactly one key, url, an x.com post URL');
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);

console.log(`gta6-meme-x-01 round 4 v2: POST.json copied -> ${post.url}`);
