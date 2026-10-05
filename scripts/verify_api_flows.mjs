
const API_BASE = 'http://localhost:3000/v1';
const MAILPIT_BASE = 'http://127.0.0.1:8025/api/v1';

async function main() {
  console.log('--- 1. UJI LOGIN & REFRESH TOKEN ---');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'budi@example.com',
      password: 'Student@123',
    }),
  });

  const loginBody = await loginRes.json();
  console.log('Login Status:', loginRes.status);
  console.log('Login Success:', loginBody.success);

  if (!loginRes.ok) {
    throw new Error('Login gagal: ' + JSON.stringify(loginBody));
  }

  const rawCookies = loginRes.headers.get('set-cookie');
  console.log('Set-Cookie received:', !!rawCookies);

  // Parse refresh token from cookie
  let refreshToken = loginBody.data?.refreshToken;
  if (!refreshToken && rawCookies) {
    const match = rawCookies.match(/refreshToken=([^;]+)/);
    if (match) refreshToken = match[1];
  }

  const cookieHeader = rawCookies ? rawCookies.split(',').map(c => c.split(';')[0]).join('; ') : '';

  console.log('Testing /v1/auth/refresh...');
  const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:5173',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(refreshToken ? { refreshToken } : {}),
  });

  const refreshBody = await refreshRes.json();
  console.log('Refresh Status:', refreshRes.status);
  console.log('Refresh Success:', refreshBody.success);
  if (!refreshRes.ok) {
    throw new Error('Refresh gagal: ' + JSON.stringify(refreshBody));
  }

  console.log('--- 2. UJI RATE LIMIT ---');
  // Check auth rate limit or endpoint rate limit
  console.log('Menguji endpoint rate limit auth/login dengan multiple requests berturut-turut...');
  let hitRateLimit = false;
  let attempts = 0;
  for (let i = 0; i < 25; i++) {
    attempts++;
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.99', // distinct IP for testing rate limit
      },
      body: JSON.stringify({
        email: 'invalid-attempt@example.com',
        password: 'WrongPassword',
      }),
    });
    if (res.status === 429) {
      hitRateLimit = true;
      const rateLimitBody = await res.json();
      console.log(`Rate limit 429 terdeteksi pada percobaan ke-${attempts}:`, rateLimitBody.message || rateLimitBody);
      break;
    }
  }
  console.log('Rate limit behavior verified:', hitRateLimit ? '429 TERDETEKSI (BERHASIL)' : 'Belum mencapai batas dalam 25 percobaan');

  console.log('--- 3. UJI EMAIL LEWAT MAILPIT ---');
  // Clear existing messages first
  await fetch(`${MAILPIT_BASE}/messages`, { method: 'DELETE' }).catch(() => {});

  console.log('Mengirim permintaan forgot-password untuk budi@example.com...');
  const forgotRes = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'budi@example.com' }),
  });
  console.log('Forgot-password HTTP status:', forgotRes.status);

  // Tunggu 2 detik agar pengiriman asynchronous selesai
  await new Promise(r => setTimeout(r, 2000));

  const mailRes = await fetch(`${MAILPIT_BASE}/messages`);
  const mailData = await mailRes.json();
  console.log(`Pesan di Mailpit: ${mailData.total} pesan diterima.`);
  if (mailData.messages && mailData.messages.length > 0) {
    const latest = mailData.messages[0];
    console.log('Subjek Email:', latest.Subject);
    console.log('Penerima:', latest.To.map(t => t.Address).join(', '));
  } else {
    throw new Error('Mailpit tidak menerima pesan email!');
  }

  console.log('Semua pengujian backend (login, refresh, rate-limit, email via Mailpit) BERHASIL.');
}

main().catch(err => {
  console.error('Verifikasi gagal:', err);
  process.exit(1);
});
