import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding JSCraft database...');

  // ── Admin user ──
  const adminHash = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jscraft.dev' },
    update: {},
    create: {
      email: 'admin@jscraft.dev',
      username: 'admin',
      passwordHash: adminHash,
      displayName: 'JSCraft Admin',
      role: 'ADMIN',
      isVerified: true,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ── Demo student ──
  const studentHash = await bcrypt.hash('Student@123', 12);
  const student = await prisma.user.upsert({
    where: { email: 'budi@example.com' },
    update: {},
    create: {
      email: 'budi@example.com',
      username: 'budi_dev',
      passwordHash: studentHash,
      displayName: 'Budi Santoso',
      xpTotal: 285,
      level: 2,
      streakCurrent: 3,
      streakMax: 3,
    },
  });
  console.log(`✅ Student: ${student.email}`);

  // ── Achievements ──
  const achievements = [
    { key: 'first_lesson',  title: 'Langkah Pertama',    description: 'Menyelesaikan pelajaran pertama',       iconUrl: '🌟', xpReward: 25 },
    { key: 'week_1_done',   title: 'Minggu Pertama',     description: 'Menyelesaikan semua pelajaran Minggu 1', iconUrl: '🏅', xpReward: 50 },
    { key: 'completionist', title: 'Completionist',      description: 'Menyelesaikan semua 42 pelajaran',      iconUrl: '🏆', xpReward: 500 },
    { key: 'streak_3',      title: 'Konsisten 3 Hari',   description: 'Belajar 3 hari berturut-turut',         iconUrl: '🔥', xpReward: 15 },
    { key: 'streak_7',      title: 'Seminggu Penuh',     description: 'Belajar 7 hari berturut-turut',         iconUrl: '💪', xpReward: 30 },
    { key: 'streak_30',     title: 'Dedikasi Sebulan',   description: 'Belajar 30 hari berturut-turut',        iconUrl: '🎯', xpReward: 200 },
    { key: 'perfect_quiz',  title: 'Nilai Sempurna',     description: 'Mendapat 100% di kuis manapun',         iconUrl: '💯', xpReward: 50 },
    { key: 'speedster',     title: 'Si Cepat',           description: 'Menyelesaikan kuis dalam waktu < 1 menit',iconUrl:'⚡', xpReward: 20 },
    { key: 'playground_user',title:'Playground Pro',    description: 'Menjalankan 10 kode di playground',      iconUrl: '🖥️', xpReward: 10 },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { key: ach.key }, update: ach, create: ach,
    });
  }
  console.log(`✅ ${achievements.length} achievements seeded`);

  // ── Week 1: JavaScript Fundamentals (Course) ──
  const course = await prisma.course.upsert({
    where: { slug: 'javascript-fundamentals' },
    update: {},
    create: {
      slug: 'javascript-fundamentals',
      title: 'JavaScript Fundamentals',
      titleId: 'Dasar-Dasar JavaScript',
      description: 'Pelajari dasar JavaScript dari variabel, tipe data, operator, hingga fungsi dasar.',
      phase: 1, week: 1, order: 1, isPublished: true,
    },
  });

  // ── 7 lessons for Week 1 ──
  const lessons = [
    {
      slug: 'hello-world', title: 'Hello World', titleId: 'Halo Dunia',
      type: 'THEORY' as const, dayNumber: 1, order: 1, xpReward: 10,
      starterCode: `// Selamat datang di JSCraft!\n// Jalankan kode pertamamu\n\nconsole.log("Hello, World!");\nconsole.log("Selamat belajar JavaScript! 🚀");`,
      content: {
        sections: [
          { type: 'prose', text: 'Selamat datang di **JSCraft**! Hari ini kamu akan menulis baris kode JavaScript pertamamu. JavaScript adalah bahasa pemrograman yang berjalan di browser dan digunakan di hampir semua website.' },
          { type: 'callout', variant: 'tip', text: '💡 JavaScript bisa dijalankan langsung di browser — buka DevTools (F12) dan coba di Console!' },
          { type: 'code', language: 'javascript', code: 'console.log("Hello, World!");\nconsole.log("Saya belajar JavaScript! 🚀");', filename: 'hello.js' },
          { type: 'prose', text: '`console.log()` adalah fungsi bawaan JavaScript untuk menampilkan output ke konsol. Kamu akan menggunakannya sepanjang bootcamp ini.' },
        ],
      },
    },
    {
      slug: 'variabel-dan-tipe-data', title: 'Variables & Data Types', titleId: 'Variabel & Tipe Data',
      type: 'THEORY' as const, dayNumber: 2, order: 2, xpReward: 10,
      starterCode: `// Coba deklarasi variabel\nlet nama = "Budi";\nconst umur = 25;\nvar kota = "Jakarta"; // hindari var di kode modern\n\nconsole.log(nama, umur, kota);\nconsole.log(typeof nama); // "string"\nconsole.log(typeof umur); // "number"`,
      content: {
        sections: [
          { type: 'prose', text: 'Variabel adalah wadah untuk menyimpan data. JavaScript memiliki 3 cara deklarasi variabel: `var`, `let`, dan `const`.' },
          { type: 'callout', variant: 'warning', text: '⚠️ Gunakan `const` secara default. Gunakan `let` hanya jika nilai akan berubah. Hindari `var`.' },
          { type: 'code', language: 'javascript', code: `const pi = 3.14;        // Number\nconst nama = "Andi";    // String\nconst aktif = true;     // Boolean\nconst nilai = null;     // Null\nlet hasil;              // Undefined\n\nconsole.log(typeof pi);    // "number"\nconsole.log(typeof nama);  // "string"\nconsole.log(typeof aktif); // "boolean"` },
        ],
      },
    },
    {
      slug: 'operator-dan-ekspresi', title: 'Operators & Expressions', titleId: 'Operator & Ekspresi',
      type: 'PRACTICE' as const, dayNumber: 3, order: 3, xpReward: 15,
      starterCode: `let a = 10;\nlet b = 3;\n\n// Operator aritmatika\nconsole.log(a + b);  // ?\nconsole.log(a - b);  // ?\nconsole.log(a * b);  // ?\nconsole.log(a / b);  // ?\nconsole.log(a % b);  // sisa bagi\nconsole.log(a ** b); // pangkat\n\n// Operator perbandingan\nconsole.log(a > b);   // true\nconsole.log(a === b); // false — selalu pakai ===`,
      content: {
        sections: [
          { type: 'prose', text: 'Operator adalah simbol untuk melakukan operasi. JavaScript memiliki operator aritmatika, perbandingan, logika, dan assignment.' },
          { type: 'code', language: 'javascript', code: `// Aritmatika\nconsole.log(10 + 3);  // 13\nconsole.log(10 % 3);  // 1\nconsole.log(2 ** 8);  // 256\n\n// Perbandingan — selalu gunakan === bukan ==\nconsole.log(5 === 5);    // true\nconsole.log("5" === 5);  // false (tipe berbeda)\n\n// Logika\nconsole.log(true && false); // false\nconsole.log(true || false); // true\nconsole.log(!true);         // false` },
        ],
      },
    },
    {
      slug: 'kontrol-alur', title: 'Control Flow', titleId: 'Kontrol Alur (if/else)',
      type: 'THEORY' as const, dayNumber: 4, order: 4, xpReward: 10,
      starterCode: `const nilai = 85;\n\nif (nilai >= 90) {\n  console.log("A — Sempurna!");\n} else if (nilai >= 80) {\n  console.log("B — Bagus!");\n} else if (nilai >= 70) {\n  console.log("C — Cukup");\n} else {\n  console.log("D — Perlu belajar lebih giat");\n}`,
      content: {
        sections: [
          { type: 'prose', text: 'Kontrol alur memungkinkan program membuat keputusan. `if`, `else if`, dan `else` adalah blok kondisional paling umum.' },
          { type: 'callout', variant: 'info', text: '💡 Ternary operator adalah cara singkat untuk if/else sederhana: `kondisi ? nilaiJika : nilaiTidak`' },
          { type: 'code', language: 'javascript', code: `// Ternary operator\nconst umur = 18;\nconst status = umur >= 18 ? "Dewasa" : "Anak-anak";\nconsole.log(status); // "Dewasa"\n\n// Switch statement\nconst hari = "Senin";\nswitch (hari) {\n  case "Senin": console.log("Awal minggu"); break;\n  case "Jumat": console.log("Akhir pekan!"); break;\n  default: console.log("Hari biasa");\n}` },
        ],
      },
    },
    {
      slug: 'perulangan', title: 'Loops', titleId: 'Perulangan (Loop)',
      type: 'PRACTICE' as const, dayNumber: 5, order: 5, xpReward: 15,
      starterCode: `// for loop\nfor (let i = 1; i <= 5; i++) {\n  console.log("Nomor:", i);\n}\n\n// while loop\nlet count = 0;\nwhile (count < 3) {\n  console.log("Count:", count);\n  count++;\n}\n\n// for...of (untuk array)\nconst buah = ["apel", "mangga", "jeruk"];\nfor (const b of buah) {\n  console.log(b);\n}`,
      content: {
        sections: [
          { type: 'prose', text: 'Loop memungkinkan kita mengulang blok kode. Ada beberapa jenis loop di JavaScript: `for`, `while`, `do...while`, dan loop modern `for...of` dan `for...in`.' },
          { type: 'code', language: 'javascript', code: `// FizzBuzz klasik\nfor (let i = 1; i <= 15; i++) {\n  if (i % 15 === 0)     console.log("FizzBuzz");\n  else if (i % 3 === 0) console.log("Fizz");\n  else if (i % 5 === 0) console.log("Buzz");\n  else                  console.log(i);\n}` },
        ],
      },
    },
    {
      slug: 'fungsi', title: 'Functions', titleId: 'Fungsi',
      type: 'THEORY' as const, dayNumber: 6, order: 6, xpReward: 10,
      starterCode: `// Function declaration\nfunction sapa(nama) {\n  return "Halo, " + nama + "!";\n}\n\n// Arrow function (ES6+)\nconst tambah = (a, b) => a + b;\n\n// Default parameter\nconst perkenalan = (nama, kota = "Jakarta") => {\n  return nama + " dari " + kota;\n};\n\nconsole.log(sapa("Budi"));\nconsole.log(tambah(5, 3));\nconsole.log(perkenalan("Ani"));\nconsole.log(perkenalan("Dewi", "Surabaya"));`,
      content: {
        sections: [
          { type: 'prose', text: 'Fungsi adalah blok kode yang bisa digunakan berulang. Di JavaScript ada beberapa cara mendefinisikan fungsi: function declaration, function expression, dan arrow function.' },
          { type: 'callout', variant: 'tip', text: '💡 Arrow function adalah standar modern. Gunakan arrow function untuk kode yang lebih ringkas.' },
          { type: 'code', language: 'javascript', code: `// Higher order function\nconst angka = [1, 2, 3, 4, 5];\nconst genap = angka.filter(n => n % 2 === 0);\nconst dikali2 = angka.map(n => n * 2);\nconst total = angka.reduce((acc, n) => acc + n, 0);\n\nconsole.log(genap);    // [2, 4]\nconsole.log(dikali2);  // [2, 4, 6, 8, 10]\nconsole.log(total);    // 15` },
        ],
      },
    },
    {
      slug: 'proyek-kalkulator', title: 'Project: Simple Calculator', titleId: '🏗 Proyek: Kalkulator Sederhana',
      type: 'PROJECT' as const, dayNumber: 7, order: 7, xpReward: 30,
      starterCode: `// 🏗 Proyek Hari 7: Buat Kalkulator!\n// Implementasikan semua fungsi di bawah ini\n\nfunction tambah(a, b) {\n  // TODO\n}\n\nfunction kurang(a, b) {\n  // TODO\n}\n\nfunction kali(a, b) {\n  // TODO\n}\n\nfunction bagi(a, b) {\n  // TODO: Handle pembagian dengan 0!\n}\n\nfunction kalkulator(a, operator, b) {\n  // TODO: Gunakan fungsi di atas berdasarkan operator (+, -, *, /)\n}\n\n// Test cases — semua harus true\nconsole.log(tambah(5, 3) === 8);\nconsole.log(kurang(10, 4) === 6);\nconsole.log(kali(3, 7) === 21);\nconsole.log(bagi(15, 3) === 5);\nconsole.log(kalkulator(10, "+", 5) === 15);\nconsole.log(kalkulator(10, "/", 0) === "Error: Tidak bisa dibagi 0");`,
      content: {
        sections: [
          { type: 'prose', text: 'Selamat! Kamu sudah menyelesaikan Minggu 1. Sekarang saatnya menerapkan semua yang sudah kamu pelajari — variabel, operator, kondisional, dan fungsi — untuk membuat kalkulator.' },
          { type: 'callout', variant: 'tip', text: '💡 Gunakan `switch` statement di fungsi `kalkulator()` untuk memilih operasi berdasarkan operator.' },
        ],
      },
    },
  ];

  for (const lessonData of lessons) {
    const lesson = await prisma.lesson.upsert({
      where: { courseId_slug: { courseId: course.id, slug: lessonData.slug } },
      update: {},
      create: { courseId: course.id, isPublished: true, ...lessonData },
    });

    // Add quiz for day 3 (operators) as example
    if (lessonData.dayNumber === 3) {
      const quiz = await prisma.quiz.upsert({
        where: { lessonId: lesson.id },
        update: {},
        create: { lessonId: lesson.id, title: 'Kuis: Operator & Ekspresi', passingScore: 70, timeLimit: 120 },
      });
      // Create questions
      const questions = [
        {
          quizId: quiz.id, text: 'Apa hasil dari: 10 % 3', type: 'MULTIPLE_CHOICE' as const, order: 1,
          options: [{ id: 'a', text: '3', isCorrect: false }, { id: 'b', text: '1', isCorrect: true }, { id: 'c', text: '0.33', isCorrect: false }, { id: 'd', text: '30', isCorrect: false }],
          explanation: 'Operator % (modulus) menghasilkan sisa bagi. 10 dibagi 3 = 3 sisa 1.',
        },
        {
          quizId: quiz.id, text: 'Manakah cara perbandingan yang benar di JavaScript modern?', type: 'MULTIPLE_CHOICE' as const, order: 2,
          options: [{ id: 'a', text: '5 == "5"', isCorrect: false }, { id: 'b', text: '5 === "5"', isCorrect: false }, { id: 'c', text: '5 === 5', isCorrect: true }, { id: 'd', text: '5 = 5', isCorrect: false }],
          explanation: 'Gunakan === (strict equality) yang membandingkan nilai DAN tipe data.',
        },
        {
          quizId: quiz.id, text: 'Apa hasil dari: typeof (10 + "5")', type: 'MULTIPLE_CHOICE' as const, order: 3,
          options: [{ id: 'a', text: '"number"', isCorrect: false }, { id: 'b', text: '"string"', isCorrect: true }, { id: 'c', text: '"undefined"', isCorrect: false }, { id: 'd', text: '"object"', isCorrect: false }],
          explanation: 'Ketika number dijumlahkan dengan string, JavaScript mengkonversi number ke string. Hasilnya "105" bertipe string.',
        },
      ];

      await prisma.question.deleteMany({ where: { quizId: quiz.id } });
      for (const q of questions) {
        await prisma.question.create({ data: { ...q, options: q.options } });
      }
    }

    // Exercise for day 3
    if (lessonData.dayNumber === 3) {
      await prisma.exercise.upsert({
        where: { id: `ex-d3-${course.id}` },
        update: {},
        create: {
          id: `ex-d3-${course.id}`,
          lessonId: lesson.id,
          title: 'Hitung Sisa Bagi',
          description: 'Hitung sisa bagi dari 17 dibagi 5, simpan ke variabel `result`, dan tampilkan ke console.',
          starterCode: '// Tuliskan kode di sini\n',
          testCases: [{ description: 'result harus bernilai 2', expectedOutput: '2' }],
          hints: ['Gunakan operator %', 'let result = 17 % 5;'],
          xpReward: 5, order: 1,
        },
      });
    }
  }

  console.log(`✅ ${lessons.length} lessons seeded`);

  // ── Give demo student progress on first 2 lessons ──
  for (let i = 0; i < 2; i++) {
    const lesson = await prisma.lesson.findFirst({
      where: { courseId: course.id, order: i + 1 },
    });
    if (!lesson) continue;
    await prisma.progress.upsert({
      where: { userId_lessonId: { userId: student.id, lessonId: lesson.id } },
      update: {},
      create: {
        userId: student.id, lessonId: lesson.id, courseId: course.id,
        status: 'COMPLETED', completedAt: new Date(), xpEarned: lesson.xpReward,
      },
    });
  }

  console.log('\n🎉 Seeding complete!\n');
  console.log('  Admin login:   admin@jscraft.dev / Admin@123456');
  console.log('  Student login: budi@example.com  / Student@123\n');
}

main()
  .catch((err) => { console.error('Seed failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
