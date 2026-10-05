import { PrismaClient } from '@prisma/client';
import express from 'file:///C:/Users/ADVAN/OneDrive/Dokumen/jscraft/node_modules/express/index.js';
import http from 'node:http';
import jwt from 'file:///C:/Users/ADVAN/OneDrive/Dokumen/jscraft/node_modules/jsonwebtoken/index.js';

// Enforce test database requirement without hardcoded credentials
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("FATAL: Variabel lingkungan DATABASE_URL belum disetel. Jalankan dengan DATABASE_URL yang berakhiran '_test'.");
  process.exit(1);
}

// Extract database name from connection string
const dbNameMatch = dbUrl.match(/\/([^/?]+)(\?|$)/);
const dbName = dbNameMatch ? dbNameMatch[1] : '';

if (!dbName.endsWith('_test')) {
  console.error(`FATAL: Script ini HANYA boleh dijalankan pada database pengujian yang berakhiran '_test'. Database saat ini: '${dbName}'`);
  process.exit(1);
}
process.env.ENABLE_CODE_RUNNER = 'true';

const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

// Dynamically import routes after environment is configured
const { default: exercisesRouter } = await import('../apps/api/dist/routes/exercises.js');
const { errorHandler } = await import('../apps/api/dist/middleware/errorHandler.js');
const { env } = await import('../apps/api/dist/config/env.js');

const app = express();
app.use(express.json());
app.use('/v1/exercises', exercisesRouter);
app.use(errorHandler);

const server = http.createServer(app);
await new Promise((resolve) => server.listen(3359, '127.0.0.1', resolve));

try {
  // Setup clean test user and exercise in test database
  const email = `test_parallel_runner_${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email,
      username: `user_${Date.now()}`,
      passwordHash: 'hash',
      displayName: 'Parallel Tester',
      role: 'STUDENT',
      isActive: true,
      xpTotal: 0,
      level: 1,
    },
  });

  const course = await prisma.course.findFirst();
  let lesson = await prisma.lesson.findFirst({ where: { courseId: course.id } });
  if (!lesson) {
    lesson = await prisma.lesson.create({
      data: {
        courseId: course.id,
        slug: `lesson-${Date.now()}`,
        title: 'Parallel Test Lesson',
        order: 999,
        isPublished: true,
      },
    });
  }

  const exercise = await prisma.exercise.create({
    data: {
      lessonId: lesson.id,
      title: 'Parallel XP Test Exercise',
      description: 'Return value 42',
      starterCode: 'function solve() { return 42; }',
      xpReward: 10,
      order: 1,
      hints: [],
      testCases: [
        {
          input: '',
          expectedOutput: '42',
          description: 'Cek return 42',
          hidden: false,
        },
      ],
    },
  });

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    env.JWT_ACCESS_SECRET,
    { algorithm: 'HS256', expiresIn: '1h', issuer: 'jscraft-api', audience: 'jscraft-app' }
  );

  const apiBase = process.env.API_BASE_URL || 'http://127.0.0.1:3359';

  // Verifikasi bahwa API yang diuji membaca dari database _test yang sama
  const probeResponse = await fetch(`${apiBase}/v1/exercises/${exercise.lessonId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!probeResponse.ok) {
    throw new Error(`FATAL: Gagal melakukan probe ke API (${probeResponse.status}).`);
  }
  const probeData = await probeResponse.json();
  const foundInApi = probeData.data?.some((e) => e.id === exercise.id);
  if (!foundInApi) {
    throw new Error(
      `FATAL: API yang diuji tidak melihat latihan yang baru dibuat di database '${dbName}'. API dan skrip wajib mengarah ke database _test yang sama.`
    );
  }
  console.log(`Verifikasi database: API terbukti terhubung ke database '${dbName}' yang sama.`);

  console.log(`Menjalankan 10 permintaan HTTP submit latihan paralel untuk user ${user.id} dan exercise ${exercise.id}...`);

  const requests = Array.from({ length: 10 }, (_, i) =>
    fetch(`${apiBase}/v1/exercises/${exercise.id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        code: 'console.log(42);',
      }),
    }).then(async (res) => {
      const data = await res.json();
      return { status: res.status, data };
    })
  );

  const results = await Promise.all(requests);

  const awardedXpList = results.map((r) => r.data.data?.xpEarned);
  const passedList = results.map((r) => r.data.data?.passed);
  const totalAwarded = awardedXpList.filter((xp) => xp === 10).length;
  const zeroAwarded = awardedXpList.filter((xp) => xp === 0).length;

  const completionsInDb = await prisma.exerciseCompletion.findMany({
    where: { userId: user.id, exerciseId: exercise.id },
  });

  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  console.log(`Hasil 10 permintaan paralel:`);
  console.log(`- Berhasil lulus: ${passedList.filter(Boolean).length}/10`);
  console.log(`- Permintaan yang memperoleh XP (10 XP): ${totalAwarded}`);
  console.log(`- Permintaan yang memperoleh 0 XP (idempoten): ${zeroAwarded}`);
  console.log(`- Rekaman ExerciseCompletion di DB: ${completionsInDb.length}`);
  console.log(`- Total XP user di DB: ${updatedUser.xpTotal}`);

  if (totalAwarded !== 1) {
    throw new Error(`GAGAL: Diharapkan tepat 1 permintaan mendapat XP, namun ${totalAwarded} permintaan mendapat XP.`);
  }

  if (updatedUser.xpTotal !== 10) {
    throw new Error(`GAGAL: Total XP user harus 10, ditemukan ${updatedUser.xpTotal}.`);
  }

  if (completionsInDb.length !== 1) {
    throw new Error(`GAGAL: ExerciseCompletion harus tepat 1, ditemukan ${completionsInDb.length}.`);
  }

  console.log('UJI PARALEL XP BERHASIL: Idempotensi terbukti secara atomik.');

  // Cleanup
  await prisma.exerciseCompletion.deleteMany({ where: { userId: user.id } });
  await prisma.exerciseAttempt.deleteMany({ where: { userId: user.id } });
  await prisma.exercise.delete({ where: { id: exercise.id } });
  await prisma.user.delete({ where: { id: user.id } });
} finally {
  server.close();
  await prisma.$disconnect();
}
