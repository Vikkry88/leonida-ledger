// Leonida Ledger — entry program for make.fun competition gta6-trophy-guide-01.
//
// The guide itself is the static site in app/ (index.html, style.css, app.js
// and data/trophies.json). It runs fully offline in a desktop browser: every
// file it loads lives under app/, and progress is kept in localStorage.
//
// This program hands the guide in. It copies app/ and screenshots/ into the
// output folder (/output in the grader, or MAKEFUN_OUTPUT_DIR locally) and
// writes dossier.json there using buildDossier from vendor/makefun-frontend.ts
// — the kit's library, left byte-for-byte unchanged, since the scorer rebuilds
// the dossier with its own copy and compares the two exactly.
//
// Run it locally with:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Preview the guide with:  node serve.ts   (then open http://localhost:8080)
// Requires Node.js 22.18 or later (TypeScript runs as-is); standard library only.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the guide and its screenshots into the output folder.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Build the dossier the judge reads, under the scorer's published caps:
// dossier text at most 163840 bytes, at most 4 screenshots of 256 KiB each,
// app/ at most 993 entries and 48 MiB in total.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
