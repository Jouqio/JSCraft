/**
 * WCAG Contrast Calculator for JSCraft design tokens.
 * Validates all semantic foreground/background pairs meet WCAG AA (4.5:1 normal, 3:1 large/UI) and AAA (7:1).
 *
 * Requirements:
 * - Focus ring on paper and card (light and dark) (min 3:1)
 * - Control borders on paper and card (light and dark) (min 3:1)
 * - Button text on amber (light and dark) (min 4.5:1)
 * - Muted text on paper-subtle (light and dark) (min 4.5:1)
 * - White on amber (MUST be recorded as FAIL and marked as NOT USED)
 * Failing on any USED pair causes exit code 1.
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

// ── Design Token Hex Values ──
const LIGHT = {
  paper: '#faf9f6',
  paperCard: '#ffffff',
  paperSubtle: '#f3f1ec',
  ink: '#1e1c16',
  inkMuted: '#5e5a52',
  controlBorder: '#8a8477',
  focus: '#d97706',
  accent: '#f59e0b',
  accentHover: '#d97706',
  accentText: '#b45309',
  accentTextHigh: '#92400e',
  buttonText: '#1e1c16',
  white: '#ffffff',
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
  controlBorder: '#6e6a60',
  focus: '#d97706',
  accent: '#f59e0b',
  accentHover: '#d97706',
  accentText: '#fbbf24',
  accentTextHigh: '#fbbf24',
  buttonText: '#1e1c16',
  white: '#ffffff',
  successText: '#4ade80',
  errorText: '#f87171',
  warningText: '#facc15',
};

// Define pairs to evaluate
const pairs = [
  // ── 1. Focus Ring on Paper and Card (Light & Dark) — Min 3:1 (WCAG SC 1.4.11) ──
  {
    theme: 'light',
    fg: 'focus (ring)',
    bg: 'paper',
    fgHex: LIGHT.focus,
    bgHex: LIGHT.paper,
    target: 3.0,
    used: true,
    note: 'focus ring UI',
  },
  {
    theme: 'light',
    fg: 'focus (ring)',
    bg: 'paperCard',
    fgHex: LIGHT.focus,
    bgHex: LIGHT.paperCard,
    target: 3.0,
    used: true,
    note: 'focus ring UI',
  },
  {
    theme: 'dark',
    fg: 'focus (ring)',
    bg: 'paper',
    fgHex: DARK.focus,
    bgHex: DARK.paper,
    target: 3.0,
    used: true,
    note: 'focus ring UI',
  },
  {
    theme: 'dark',
    fg: 'focus (ring)',
    bg: 'paperCard',
    fgHex: DARK.focus,
    bgHex: DARK.paperCard,
    target: 3.0,
    used: true,
    note: 'focus ring UI',
  },

  // ── 2. Control Borders — Min 3:1 (WCAG SC 1.4.11) ──
  {
    theme: 'light',
    fg: 'controlBorder',
    bg: 'paper',
    fgHex: LIGHT.controlBorder,
    bgHex: LIGHT.paper,
    target: 3.0,
    used: true,
    note: 'input/select border',
  },
  {
    theme: 'light',
    fg: 'controlBorder',
    bg: 'paperCard',
    fgHex: LIGHT.controlBorder,
    bgHex: LIGHT.paperCard,
    target: 3.0,
    used: true,
    note: 'card input border',
  },
  {
    theme: 'dark',
    fg: 'controlBorder',
    bg: 'paper',
    fgHex: DARK.controlBorder,
    bgHex: DARK.paper,
    target: 3.0,
    used: true,
    note: 'input/select border',
  },
  {
    theme: 'dark',
    fg: 'controlBorder',
    bg: 'paperCard',
    fgHex: DARK.controlBorder,
    bgHex: DARK.paperCard,
    target: 3.0,
    used: true,
    note: 'card input border',
  },

  // ── 3. Button Text on Amber (Light & Dark) — Min 4.5:1 (WCAG AA) ──
  {
    theme: 'light',
    fg: 'btn-text (ink)',
    bg: 'amber (brand-500)',
    fgHex: LIGHT.buttonText,
    bgHex: LIGHT.accent,
    target: 4.5,
    used: true,
    note: 'primary button text',
  },
  {
    theme: 'dark',
    fg: 'btn-text (ink)',
    bg: 'amber (brand-500)',
    fgHex: DARK.buttonText,
    bgHex: DARK.accent,
    target: 4.5,
    used: true,
    note: 'primary button text',
  },

  // ── 4. Muted Text on Paper-Subtle (Light & Dark) — Min 4.5:1 ──
  {
    theme: 'light',
    fg: 'inkMuted',
    bg: 'paperSubtle',
    fgHex: LIGHT.inkMuted,
    bgHex: LIGHT.paperSubtle,
    target: 4.5,
    used: true,
    note: 'secondary text',
  },
  {
    theme: 'dark',
    fg: 'inkMuted',
    bg: 'paperSubtle',
    fgHex: DARK.inkMuted,
    bgHex: DARK.paperSubtle,
    target: 4.5,
    used: true,
    note: 'secondary text',
  },

  // ── 5. White on Amber — MUST BE RECORDED AS FAIL AND NOT USED ──
  {
    theme: 'light',
    fg: 'white (banned)',
    bg: 'amber (brand-500)',
    fgHex: LIGHT.white,
    bgHex: LIGHT.accent,
    target: 4.5,
    used: false,
    note: 'GAGAL - TIDAK DIPAKAI (dilarang pada tombol amber)',
  },
  {
    theme: 'dark',
    fg: 'white (banned)',
    bg: 'amber (brand-500)',
    fgHex: DARK.white,
    bgHex: DARK.accent,
    target: 4.5,
    used: false,
    note: 'GAGAL - TIDAK DIPAKAI (dilarang pada tombol amber)',
  },

  // ── 6. Other Semantic Content Pairs ──
  {
    theme: 'light',
    fg: 'ink',
    bg: 'paper',
    fgHex: LIGHT.ink,
    bgHex: LIGHT.paper,
    target: 4.5,
    used: true,
    note: 'primary body text',
  },
  {
    theme: 'light',
    fg: 'ink',
    bg: 'paperCard',
    fgHex: LIGHT.ink,
    bgHex: LIGHT.paperCard,
    target: 4.5,
    used: true,
    note: 'card body text',
  },
  {
    theme: 'light',
    fg: 'accentText',
    bg: 'paper',
    fgHex: LIGHT.accentText,
    bgHex: LIGHT.paper,
    target: 4.5,
    used: true,
    note: 'accent text',
  },
  {
    theme: 'light',
    fg: 'accentText',
    bg: 'paperCard',
    fgHex: LIGHT.accentText,
    bgHex: LIGHT.paperCard,
    target: 4.5,
    used: true,
    note: 'card accent text',
  },
  {
    theme: 'light',
    fg: 'successText',
    bg: 'paper',
    fgHex: LIGHT.successText,
    bgHex: LIGHT.paper,
    target: 4.5,
    used: true,
    note: 'success status text',
  },
  {
    theme: 'light',
    fg: 'errorText',
    bg: 'paper',
    fgHex: LIGHT.errorText,
    bgHex: LIGHT.paper,
    target: 4.5,
    used: true,
    note: 'error status text',
  },
  {
    theme: 'light',
    fg: 'warningText',
    bg: 'paper',
    fgHex: LIGHT.warningText,
    bgHex: LIGHT.paper,
    target: 4.5,
    used: true,
    note: 'warning status text',
  },

  {
    theme: 'dark',
    fg: 'ink',
    bg: 'paper',
    fgHex: DARK.ink,
    bgHex: DARK.paper,
    target: 4.5,
    used: true,
    note: 'primary body text',
  },
  {
    theme: 'dark',
    fg: 'ink',
    bg: 'paperCard',
    fgHex: DARK.ink,
    bgHex: DARK.paperCard,
    target: 4.5,
    used: true,
    note: 'card body text',
  },
  {
    theme: 'dark',
    fg: 'accentText',
    bg: 'paper',
    fgHex: DARK.accentText,
    bgHex: DARK.paper,
    target: 4.5,
    used: true,
    note: 'accent text',
  },
  {
    theme: 'dark',
    fg: 'accentText',
    bg: 'paperCard',
    fgHex: DARK.accentText,
    bgHex: DARK.paperCard,
    target: 4.5,
    used: true,
    note: 'card accent text',
  },
  {
    theme: 'dark',
    fg: 'successText',
    bg: 'paper',
    fgHex: DARK.successText,
    bgHex: DARK.paper,
    target: 4.5,
    used: true,
    note: 'success status text',
  },
  {
    theme: 'dark',
    fg: 'errorText',
    bg: 'paper',
    fgHex: DARK.errorText,
    bgHex: DARK.paper,
    target: 4.5,
    used: true,
    note: 'error status text',
  },
  {
    theme: 'dark',
    fg: 'warningText',
    bg: 'paper',
    fgHex: DARK.warningText,
    bgHex: DARK.paper,
    target: 4.5,
    used: true,
    note: 'warning status text',
  },
];

// ── Run Evaluation ──
console.log('='.repeat(105));
console.log('WCAG Contrast Report for JSCraft Design Tokens');
console.log('='.repeat(105));
console.log(
  'Theme'.padEnd(7),
  'Foreground'.padEnd(20),
  'Background'.padEnd(22),
  'Ratio'.padEnd(8),
  'Req.'.padEnd(7),
  'Grade'.padEnd(10),
  'Status'.padEnd(12),
  'Note'
);
console.log('-'.repeat(105));

let failedUsedCount = 0;

for (const p of pairs) {
  const ratio = contrastRatio(p.fgHex, p.bgHex);
  const g = grade(ratio);
  const meetsTarget = ratio >= p.target;

  let statusText = '';
  if (p.used) {
    if (meetsTarget) {
      statusText = 'PASS (USED)';
    } else {
      statusText = 'FAIL (USED)';
      failedUsedCount++;
    }
  } else {
    // Unused / anti-pattern: must be recorded as FAIL (NOT USED)
    statusText = meetsTarget ? 'WARN (UNUSED)' : 'FAIL (NOT USED)';
  }

  console.log(
    p.theme.padEnd(7),
    p.fg.padEnd(20),
    p.bg.padEnd(22),
    ratio.toFixed(2).padEnd(8),
    `>=${p.target}`.padEnd(7),
    g.padEnd(10),
    statusText.padEnd(12),
    p.note
  );
}

console.log('='.repeat(105));
if (failedUsedCount === 0) {
  console.log('All USED pairs PASS WCAG standards.');
  console.log('Unused pairs (white on amber) correctly recorded as FAIL (NOT USED).');
  process.exit(0);
} else {
  console.error(`FAIL: ${failedUsedCount} used pair(s) failed WCAG requirements!`);
  process.exit(1);
}
