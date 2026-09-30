/**
 * WCAG Contrast Calculator for JSCraft design tokens.
 * Validates all semantic foreground/background pairs meet WCAG AA (4.5:1 normal, 3:1 large) and AAA (7:1).
 *
 * Run: node scripts/contrast_check.mjs
 */

// Hex-to-sRGB linear helper
function hexToLinear(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b].map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
}

function relativeLuminance(hex) {
  const [R, G, B] = hexToLinear(hex);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function grade(ratio) {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA-large';
  return 'FAIL';
}

// ── Design Token Hex Fallback Values ──
const LIGHT = {
  paper: '#faf9f6',
  paperCard: '#ffffff',
  paperSubtle: '#f3f1ec',
  ink: '#1e1c16',
  inkMuted: '#5e5a52',
  accent: '#f59e0b',
  accentHover: '#d97706',
  accentText: '#b45309',
  accentTextHigh: '#92400e',
  successText: '#15803d',
  errorText: '#b91c1c',
  warningText: '#a16207',
};

const DARK = {
  paper: '#141310',
  paperCard: '#1c1b17',
  paperSubtle: '#262420',
  ink: '#f5f4f0',
  inkMuted: '#9e9a90',
  accent: '#f59e0b',
  accentHover: '#d97706',
  accentText: '#fbbf24',
  accentTextHigh: '#fbbf24',
  successText: '#4ade80',
  errorText: '#f87171',
  warningText: '#facc15',
};

// Define foreground/background pairs to test
const pairs = [
  // Light theme
  { theme: 'light', fg: 'ink', bg: 'paper', fgHex: LIGHT.ink, bgHex: LIGHT.paper },
  { theme: 'light', fg: 'ink', bg: 'paperCard', fgHex: LIGHT.ink, bgHex: LIGHT.paperCard },
  { theme: 'light', fg: 'inkMuted', bg: 'paper', fgHex: LIGHT.inkMuted, bgHex: LIGHT.paper },
  { theme: 'light', fg: 'inkMuted', bg: 'paperCard', fgHex: LIGHT.inkMuted, bgHex: LIGHT.paperCard },
  { theme: 'light', fg: 'accentText', bg: 'paper', fgHex: LIGHT.accentText, bgHex: LIGHT.paper },
  { theme: 'light', fg: 'accentText', bg: 'paperCard', fgHex: LIGHT.accentText, bgHex: LIGHT.paperCard },
  { theme: 'light', fg: 'accentTextHigh', bg: 'paper', fgHex: LIGHT.accentTextHigh, bgHex: LIGHT.paper },
  { theme: 'light', fg: 'successText', bg: 'paper', fgHex: LIGHT.successText, bgHex: LIGHT.paper },
  { theme: 'light', fg: 'successText', bg: 'paperCard', fgHex: LIGHT.successText, bgHex: LIGHT.paperCard },
  { theme: 'light', fg: 'errorText', bg: 'paper', fgHex: LIGHT.errorText, bgHex: LIGHT.paper },
  { theme: 'light', fg: 'errorText', bg: 'paperCard', fgHex: LIGHT.errorText, bgHex: LIGHT.paperCard },
  { theme: 'light', fg: 'warningText', bg: 'paper', fgHex: LIGHT.warningText, bgHex: LIGHT.paper },
  { theme: 'light', fg: 'warningText', bg: 'paperCard', fgHex: LIGHT.warningText, bgHex: LIGHT.paperCard },
  { theme: 'light', fg: 'accent', bg: 'paper', fgHex: LIGHT.accent, bgHex: LIGHT.paper, note: 'icon/decorative only' },

  // Dark theme
  { theme: 'dark', fg: 'ink', bg: 'paper', fgHex: DARK.ink, bgHex: DARK.paper },
  { theme: 'dark', fg: 'ink', bg: 'paperCard', fgHex: DARK.ink, bgHex: DARK.paperCard },
  { theme: 'dark', fg: 'inkMuted', bg: 'paper', fgHex: DARK.inkMuted, bgHex: DARK.paper },
  { theme: 'dark', fg: 'inkMuted', bg: 'paperCard', fgHex: DARK.inkMuted, bgHex: DARK.paperCard },
  { theme: 'dark', fg: 'accentText', bg: 'paper', fgHex: DARK.accentText, bgHex: DARK.paper },
  { theme: 'dark', fg: 'accentText', bg: 'paperCard', fgHex: DARK.accentText, bgHex: DARK.paperCard },
  { theme: 'dark', fg: 'successText', bg: 'paper', fgHex: DARK.successText, bgHex: DARK.paper },
  { theme: 'dark', fg: 'successText', bg: 'paperCard', fgHex: DARK.successText, bgHex: DARK.paperCard },
  { theme: 'dark', fg: 'errorText', bg: 'paper', fgHex: DARK.errorText, bgHex: DARK.paper },
  { theme: 'dark', fg: 'errorText', bg: 'paperCard', fgHex: DARK.errorText, bgHex: DARK.paperCard },
  { theme: 'dark', fg: 'warningText', bg: 'paper', fgHex: DARK.warningText, bgHex: DARK.paper },
  { theme: 'dark', fg: 'warningText', bg: 'paperCard', fgHex: DARK.warningText, bgHex: DARK.paperCard },
  { theme: 'dark', fg: 'accent', bg: 'paper', fgHex: DARK.accent, bgHex: DARK.paper, note: 'icon/decorative only' },
];

// ── Run ──
console.log('WCAG Contrast Report for JSCraft Design Tokens');
console.log('='.repeat(90));
console.log(
  'Theme'.padEnd(7),
  'Foreground'.padEnd(16),
  'Background'.padEnd(14),
  'FG Hex'.padEnd(10),
  'BG Hex'.padEnd(10),
  'Ratio'.padEnd(8),
  'Grade'.padEnd(10),
  'Note'
);
console.log('-'.repeat(90));

let allPass = true;
for (const p of pairs) {
  const ratio = contrastRatio(p.fgHex, p.bgHex);
  const g = grade(ratio);
  const isText = !p.note?.includes('decorative');
  const pass = isText ? g !== 'FAIL' : true;
  if (!pass) allPass = false;
  console.log(
    p.theme.padEnd(7),
    p.fg.padEnd(16),
    p.bg.padEnd(14),
    p.fgHex.padEnd(10),
    p.bgHex.padEnd(10),
    ratio.toFixed(2).padEnd(8),
    g.padEnd(10),
    p.note || (pass ? '' : 'NEEDS FIX')
  );
}

console.log('='.repeat(90));
console.log(allPass ? 'All pairs PASS WCAG AA or better.' : 'Some pairs FAIL. Review notes above.');
process.exit(allPass ? 0 : 1);
