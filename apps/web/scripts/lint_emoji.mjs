/**
 * lint:emoji -- deny-list check for emoji and emoji-like Unicode in source files.
 * Ensures no new emoji/unicode symbols leak into JSX, .ts, .tsx, .css source.
 *
 * Run: node scripts/lint_emoji.mjs
 * Exit 0 = clean, Exit 1 = violations found.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';

const SRC_DIR = join(process.cwd(), 'src');
const EXTS = new Set(['.ts', '.tsx', '.css']);

// Broad emoji/symbol ranges
const EMOJI_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{231A}\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}\u{26AB}\u{26BD}\u{26BE}\u{26C4}\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}]/gu;

// Known allowlist (none -- zero tolerance)
const ALLOW_LIST = new Set([]);

function* walkDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      yield* walkDir(fullPath);
    } else if (EXTS.has(extname(entry.name))) {
      yield fullPath;
    }
  }
}

let violations = 0;
const findings = [];

for (const filePath of walkDir(SRC_DIR)) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const matches = lines[i].matchAll(EMOJI_REGEX);
    for (const match of matches) {
      const char = match[0];
      if (ALLOW_LIST.has(char)) continue;
      const codepoint = [...char].map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase()).join(' ');
      findings.push({
        file: relative(process.cwd(), filePath),
        line: i + 1,
        col: match.index + 1,
        char,
        codepoint,
      });
      violations++;
    }
  }
}

// Parse CLI args
const args = process.argv.slice(2);
const baselineIdx = args.indexOf('--baseline');
const baseline = baselineIdx !== -1 ? parseInt(args[baselineIdx + 1], 10) : 0;

if (violations <= baseline) {
  if (violations === 0) {
    console.log('lint:emoji PASS -- 0 emoji found in source.');
  } else {
    console.log(`lint:emoji PASS -- ${violations} baseline emoji found (threshold: ${baseline}, 0 new emojis).`);
  }
  process.exit(0);
} else {
  const newCount = violations - baseline;
  console.log(`lint:emoji FAIL -- ${violations} emoji/symbol(s) found (${newCount} new over baseline ${baseline}):\n`);
  for (const f of findings) {
    console.log(`  ${f.file}:${f.line}:${f.col}  ${f.char}  (${f.codepoint})`);
  }
  process.exit(1);
}
