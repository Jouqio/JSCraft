import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Regex pattern: matches standard URI schemes containing embedded username and password
// e.g., postgresql://username:password@host:port/db
// Captures scheme and password segment
export const CONNECTION_STRING_WITH_PASSWORD_REGEX =
  /(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|redis|amqp[s]?):\/\/[^\s:@'"]+:([^\s:@'"]+)@[^\s/'"]+/gi;

// Ignored files (templates containing explicit dummy placeholders)
const IGNORED_FILES = new Set([
  'apps/api/.env.example',
  'apps/web/.env.example',
  '.env.example',
]);

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp', 'pdf', 'dump', 'lock'
]);

console.log('Menjalankan pemeriksaan string koneksi berkredensial pada seluruh file ter-track...');

const trackedFiles = execSync('git ls-files', { encoding: 'utf-8' })
  .split('\n')
  .map((f) => f.trim())
  .filter(Boolean);

let violationCount = 0;

for (const file of trackedFiles) {
  if (IGNORED_FILES.has(file)) continue;

  const ext = file.split('.').pop()?.toLowerCase();
  if (ext && BINARY_EXTENSIONS.has(ext)) continue;

  let content = '';
  try {
    content = readFileSync(file, 'utf-8');
  } catch {
    continue;
  }

  const lines = content.split('\n');
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    CONNECTION_STRING_WITH_PASSWORD_REGEX.lastIndex = 0;
    const match = CONNECTION_STRING_WITH_PASSWORD_REGEX.exec(line);

    if (match) {
      const password = match[1];
      // Ignore template placeholders like ${...}, $VAR, or <placeholder>
      if (
        (password.startsWith('${') && password.endsWith('}')) ||
        (password.startsWith('<') && password.endsWith('>')) ||
        password.startsWith('$')
      ) {
        continue;
      }
      console.error(
        `PELANGGARAN KREDENSIAL: Ditemukan string koneksi berkredensial di ${file}:${lineNum + 1}`
      );
      console.error(`Baris: ${line.trim().replace(password, '********')}`);
      violationCount++;
    }
  }
}

if (violationCount > 0) {
  console.error(`\nGagal: Ditemukan ${violationCount} berkas ter-track yang memuat string koneksi dengan kredensial.`);
  process.exit(1);
} else {
  console.log('Pemeriksaan berhasil: Tidak ditemukan string koneksi berkredensial di seluruh berkas ter-track.');
  process.exit(0);
}
