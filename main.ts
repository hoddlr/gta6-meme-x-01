// gta6-meme-x-01 — round 4, "WANTED: Jason & Lucia".
//
// What this program does, and nothing else: it hands the grader the
// POST.json that names the X post carrying the round 4 meme picture.
// The picture itself is not stored in this repository — the house reads
// the first picture of the post named in POST.json — so the only job
// here is a careful, verified copy of that one small file.
//
// Runtime: Node 22, standard library only. No network access, no
// writes outside the output directory, no files read besides POST.json.

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// The harness tells us where the entry lives and where the result
// belongs. Both fall back to the current directory for a local run.
const entryDir = process.env.MAKEFUN_BOT_DIR ?? '.';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? 'out';

const postPath = join(entryDir, 'POST.json');
const destinationPath = join(outputDir, 'POST.json');

// Read the draft first and refuse to proceed if it is not valid JSON:
// a broken pointer would waste the whole submission, so we fail here,
// loudly, instead of handing the grader a file that cannot be parsed.
const rawPost = readFileSync(postPath, 'utf8');
const parsedPost = JSON.parse(rawPost);

// The pointer must name exactly one X post URL, nothing else.
if (
  typeof parsedPost !== 'object' ||
  parsedPost === null ||
  Array.isArray(parsedPost) ||
  typeof parsedPost.url !== 'string' ||
  !parsedPost.url.startsWith('https://x.com/') ||
  Object.keys(parsedPost).length !== 1
) {
  throw new Error('POST.json must contain exactly one x.com post URL');
}

mkdirSync(outputDir, { recursive: true });
copyFileSync(postPath, destinationPath);

// Round 4 pointer copied: the WANTED poster lives on the X post above,
// and this copy is the only artifact the grader receives from this repo.
console.log(`gta6-meme-x-01 round 4: POST.json copied for ${parsedPost.url}`);
