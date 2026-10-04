/**
 * Audit Data Leaks Script
 * Fetches course, lesson, quiz, and exercise endpoints to verify data exposure.
 * Enforces local-only execution and sanitized outputs.
 */

import { URL } from 'node:url';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/v1';
const parsedUrl = new URL(BASE_URL);

// Enforce local-only target to prevent accidental runs against remote environments
const isLocal =
  parsedUrl.hostname === 'localhost' ||
  parsedUrl.hostname === '127.0.0.1' ||
  parsedUrl.hostname === '::1';

if (!isLocal) {
  console.error(`Rejected non-local target host: ${parsedUrl.hostname}`);
  process.exit(1);
}

const STUDENT_EMAIL = process.env.STUDENT_EMAIL || 'budi@example.com';
const STUDENT_PASSWORD = process.env.STUDENT_PASSWORD || 'Student@123';

/**
 * Sanitizes object by masking sensitive credential fields in logs
 */
function sanitizeForDisplay(obj, depth = 0) {
  if (depth > 5) return '[Truncated]';
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForDisplay(item, depth + 1));
  }
  if (obj !== null && typeof obj === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      if (['password', 'accessToken', 'refreshToken', 'token', 'authorization'].includes(key.toLowerCase())) {
        clean[key] = '[MASKED]';
      } else {
        clean[key] = sanitizeForDisplay(value, depth + 1);
      }
    }
    return clean;
  }
  return obj;
}

/**
 * Collects all keys recursively in an object to verify presence/absence of forbidden keys
 */
export function extractAllKeys(obj, prefix = '') {
  const keys = new Set();
  if (Array.isArray(obj)) {
    for (const item of obj) {
      for (const k of extractAllKeys(item, prefix ? `${prefix}[]` : '[]')) {
        keys.add(k);
      }
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      keys.add(fullKey);
      for (const nested of extractAllKeys(v, fullKey)) {
        keys.add(nested);
      }
    }
  }
  return Array.from(keys);
}

async function run() {
  console.log(`Starting audit against ${BASE_URL} (local verified)...`);

  // 1. Login student to obtain token for authenticated endpoints
  console.log(`Authenticating as student ${STUDENT_EMAIL}...`);
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: STUDENT_EMAIL, password: STUDENT_PASSWORD }),
  });

  if (!loginRes.ok) {
    throw new Error(`Failed to login: ${loginRes.status} ${loginRes.statusText}`);
  }

  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;
  if (!token) {
    throw new Error('Access token not returned from login');
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const results = {};

  // 2. GET /courses/javascript-fundamentals
  console.log('Fetching GET /courses/javascript-fundamentals...');
  const courseRes = await fetch(`${BASE_URL}/courses/javascript-fundamentals`);
  results.course = {
    status: courseRes.status,
    data: await courseRes.json(),
  };

  const lessonList = results.course.data?.data?.lessons ?? [];
  const lesson1 = lessonList[0];
  // Find a lesson with dayNumber 3 (which has exercise) or another lesson
  const lesson3 = lessonList.find((l) => l.dayNumber === 3) || lessonList[1] || lesson1;

  if (lesson1) {
    console.log(`Fetching GET /courses/javascript-fundamentals/lessons/${lesson1.id} (Lesson 1)...`);
    const l1Res = await fetch(`${BASE_URL}/courses/javascript-fundamentals/lessons/${lesson1.id}`);
    results.lesson1 = {
      status: l1Res.status,
      data: await l1Res.json(),
    };
  }

  if (lesson3) {
    console.log(`Fetching GET /courses/javascript-fundamentals/lessons/${lesson3.id} (Lesson with Exercise)...`);
    const l3Res = await fetch(`${BASE_URL}/courses/javascript-fundamentals/lessons/${lesson3.id}`);
    results.lesson3 = {
      status: l3Res.status,
      data: await l3Res.json(),
    };

    console.log(`Fetching GET /exercises/${lesson3.id}...`);
    const exRes = await fetch(`${BASE_URL}/exercises/${lesson3.id}`);
    results.exercise = {
      status: exRes.status,
      data: await exRes.json(),
    };
  }

  // Find a lesson with a quiz (lesson 3)
  const quizLessonId = lesson3?.id;
  if (quizLessonId) {
    console.log(`Fetching GET /quiz/${quizLessonId} (Authenticated)...`);
    const qRes = await fetch(`${BASE_URL}/quiz/${quizLessonId}`, { headers: authHeaders });
    results.quiz = {
      status: qRes.status,
      data: await qRes.json(),
    };
  }

  const sanitized = sanitizeForDisplay(results);

  // Return both raw results and analysis
  return {
    raw: sanitized,
    summary: {
      courseKeys: extractAllKeys(results.course?.data),
      lesson1Keys: extractAllKeys(results.lesson1?.data),
      lesson3Keys: extractAllKeys(results.lesson3?.data),
      exerciseKeys: extractAllKeys(results.exercise?.data),
      quizKeys: extractAllKeys(results.quiz?.data),
    },
  };
}

if (process.argv[1]?.endsWith('audit-data-leaks.mjs')) {
  run()
    .then(({ raw, summary }) => {
      console.log('\n--- AUDIT SUMMARY: ALL RETURNED KEYS ---');
      console.log('Course Keys:', summary.courseKeys.slice(0, 20));
      console.log('Lesson1 Keys:', summary.lesson1Keys);
      console.log('Lesson3 Keys:', summary.lesson3Keys);
      console.log('Exercise Keys:', summary.exerciseKeys);
      console.log('Quiz Keys:', summary.quizKeys);

      const forbiddenKeys = ['solutionCode', 'isCorrect', 'explanation', 'correctOptionId'];
      console.log('\n--- FORBIDDEN KEY AUDIT CHECK ---');
      for (const [endpoint, keys] of Object.entries(summary)) {
        for (const forbidden of forbiddenKeys) {
          const found = keys.filter((k) => k.endsWith(forbidden) || k.includes(`.${forbidden}`));
          if (found.length > 0) {
            console.log(`[LEAK DETECTED] in ${endpoint}: ${found.join(', ')}`);
          }
        }
      }

      // Output stringified JSON to stdout if requested
      if (process.env.DUMP_JSON === 'true') {
        console.log(JSON.stringify(raw, null, 2));
      }

      const savePath = process.env.SAVE_AUDIT_PATH;
      if (savePath) {
        import('node:fs').then(({ writeFileSync }) => {
          writeFileSync(savePath, JSON.stringify(raw, null, 2), 'utf8');
          console.log(`\nAudit output saved to: ${savePath}`);
        });
      }
    })
    .catch((err) => {
      console.error('Audit failed:', err);
      process.exit(1);
    });
}
