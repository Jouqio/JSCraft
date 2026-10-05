<div align="center">

# JSCraft

**Platform belajar JavaScript interaktif untuk developer Indonesia**

<img src="./docx/image/Head JSCraft.jpg" alt="JSCraft Banner" width="100%" />

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/Jouqio/JSCraft/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/Jouqio/JSCraft/actions)

<p>
  <a href="#overview">Overview</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#project-structure">Structure</a> ·
  <a href="#api-reference">API</a> ·
  <a href="#deployment">Deployment</a> ·
  <a href="#roadmap">Roadmap</a>
</p>

</div>

---

## Overview

JSCraft adalah platform EdTech full-stack untuk belajar JavaScript dari nol sampai siap kerja. Terinspirasi dari freeCodeCamp, Codecademy, dan Scrimba, dengan UI modern dan konten dalam **Bahasa Indonesia**.

<div align="center">
  <!--<img src="docs/images/dashboard.png" alt="JSCraft Dashboard" width="100%" />-->
  <p><em>Dashboard dengan progress tracker, XP system, dan streak calendar</em></p>
</div>

### Features

| Belajar                       | Gamifikasi                    | Platform                            |
| ----------------------------- | ----------------------------- | ----------------------------------- |
| 42 hari kurikulum terstruktur | Sistem XP, level & streak     | Auth JWT + refresh token rotation   |
| Live code editor (Monaco)     | Kuis interaktif + leaderboard | Role-based access (Student / Admin) |
| Latihan dengan test cases     | Verifiable certificates       | Dark / Light mode                   |
| AI coding assistant (Claude)  | Dashboard progress visual     | Responsive mobile-first             |

<div align="center">
  <!--<img src="docs/images/editor.png" alt="Monaco Editor" width="49%" />
  <img src="docs/images/quiz.png" alt="Quiz System" width="49%" />>-->
  <p><em>Live code editor (Monaco)1 &nbsp;·&nbsp; Sistem kuis interaktif</em></p>
</div>

---

## Tech Stack

| Layer         | Technology                                                  |
| ------------- | ----------------------------------------------------------- |
| **Frontend**  | React 18, Vite 5, TypeScript 5                              |
| **Styling**   | Tailwind CSS v3 + custom design tokens                      |
| **State**     | Zustand v4 (persist + devtools)                             |
| **Animation** | Framer Motion                                               |
| **Editor**    | Monaco Editor (VS Code engine)                              |
| **Routing**   | React Router v6                                             |
| **Backend**   | Node.js 20, Express 4, TypeScript                           |
| **Database**  | PostgreSQL + Prisma ORM                                     |
| **Auth**      | JWT — HS256 access token + opaque refresh (httpOnly cookie) |
| **Email**     | Nodemailer (Resend / SMTP)                                  |
| **AI**        | Anthropic Claude API                                        |
| **Monorepo**  | Turborepo + npm workspaces                                  |
| **CI/CD**     | GitHub Actions → Vercel (web) + Railway (API)               |

---

## Quick Start

### Prerequisites

- Node.js `>= 20.0.0`
- PostgreSQL `>= 15`
- npm `>= 10.0.0`

### 1. Clone & Install

```bash
git clone https://github.com/Jouqio/JSCraft.git
cd jscraft
npm install
```

### 2. Environment Setup

```bash
# API
cp apps/api/.env.example apps/api/.env

# Web
cp apps/web/.env.example apps/web/.env
```

Edit `apps/api/.env` dan isi nilai berikut:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/jscraft
JWT_ACCESS_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
ENABLE_CODE_RUNNER=false  # default false; node:vm bukan batas isolasi aman
```

### 3. Generate JWT Secrets

```bash
# Jalankan dua kali — satu untuk ACCESS, satu untuk REFRESH
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Database Setup

```bash
# Jalankan setup database dari root project
npm run db:deploy      # Menerapkan migrasi database ke PostgreSQL
npm run db:generate    # Generate Prisma Client
npm run db:seed        # Membuat demo users + konten Week 1
```

### 5. Start Development

```bash
# Dari root project — menjalankan web (5173) dan api (3000) sekaligus
npm run dev
```

| Service       | URL                      |
| ------------- | ------------------------ |
| Web           | http://localhost:5173    |
| API           | http://localhost:3000/v1 |
| Prisma Studio | http://localhost:5555    |

> Jalankan `npm run db:studio` untuk membuka Prisma Studio.

### Demo Accounts

| Role    | Email             | Password       |
| ------- | ----------------- | -------------- |
| Admin   | admin@jscraft.dev | `Admin@123456` |
| Student | budi@example.com  | `Student@123`  |

---

## Deployment & Security Configuration

### Reverse Proxy & `TRUST_PROXY`

- **Default**: `TRUST_PROXY=false` (aman untuk local development langsung ke server).
- **Railway / Production**: Set `TRUST_PROXY=1` di environment Railway. Railway menempatkan 1 reverse proxy di depan container. Nilai `1` memberi instruksi kepada Express untuk membaca IP klien dari hop pertama `X-Forwarded-For`, mencegah IP spoofing sekaligus memastikan rate limiter menghitung IP pengguna asli.
- **Verifikasi Hop**: Buat request `curl -H "X-Forwarded-For: 203.0.113.195" https://api.yourdomain.com/v1/health` dan periksa IP yang dicatat morgan/rate limiter untuk memastikan IP tidak tertukar dengan proxy internal.

### Cookie Policy (SameSite Lax & Domain)

- Refresh token dikirimkan melalui cookie httpOnly dengan `SameSite=Lax` dan `Path=/v1/auth`.
- **Syarat Domain**: Frontend Web dan Backend API **harus berada dalam satu situs / domain induk yang sama** (misal `jscraft.dev` dan `api.jscraft.dev`, atau reverse proxy routing `/` dan `/v1`). Jangan menggunakan domain berbeda level TLD (cross-site) karena browser akan memblokir pengiriman cookie Lax pada request POST cross-site.

### Rate Limiting & Multi-Instance

- Rate limiter backend menggunakan _in-memory store_ secara bawaan.
- **Catatan**: Penghitung rate limit bersifat lokal per-proses/container dan tidak dibagi antar instance horizontal kecuali dikonfigurasi menggunakan Redis store (`REDIS_URL`).

## Project Structure

```
jscraft/                          # Turborepo monorepo root
├── docs/
│   └── images/                   # Screenshot dan aset README
│       ├── banner.png
│       ├── dashboard.png
│       ├── editor.png
│       └── quiz.png
├── apps/
│   ├── web/                      # React + Vite frontend (@jscraft/web)
│   │   └── src/
│   │       ├── components/
│   │       │   ├── ui/           # Button, Input, Badge, Modal, Spinner
│   │       │   ├── layout/       # Navbar, RootLayout
│   │       │   ├── editor/       # CodeEditor, ConsoleOutput, RunButton
│   │       │   ├── lesson/       # QuizBlock
│   │       │   └── dashboard/    # ProgressRing, XPBar, StreakCalendar
│   │       ├── features/         # Feature-specific logic
│   │       ├── hooks/            # useAuth, useProgress, useEditor, ...
│   │       ├── lib/              # api.ts, utils.ts, xp.ts, validators.ts
│   │       ├── pages/            # Route-level page components
│   │       ├── router/           # Router config + guards
│   │       ├── store/            # Zustand stores (auth, progress, editor, theme)
│   │       └── styles/           # globals.css (Tailwind + design tokens)
│   │
│   └── api/                      # Express + Prisma backend (@jscraft/api)
│       ├── prisma/               # schema.prisma + seed.ts + migrations/
│       └── src/
│           ├── config/           # env.ts (Zod), database.ts (Prisma)
│           ├── middleware/       # auth.ts, errorHandler.ts, rateLimit.ts, validate.ts
│           ├── routes/           # auth, courses, progress, quiz, exercises, profile, admin, ai
│           ├── services/         # authService, xpService, streakService, progressService, emailService
│           ├── utils/            # response.ts, crypto.ts
│           └── server.ts         # Express app + graceful shutdown
│
└── packages/
    ├── types/                    # Shared TypeScript types (@jscraft/types)
    └── content/                  # Lesson MDX content files (@jscraft/content)
```

---

## Database Schema

Key models in `apps/api/prisma/schema.prisma`:

| Model                               | Description                                |
| ----------------------------------- | ------------------------------------------ |
| `User`                              | Auth, XP, level, streak                    |
| `Course` → `Lesson`                 | Content as JSON, starterCode, solutionCode |
| `Progress`                          | Per user/lesson, unique constraint         |
| `Quiz` → `Question` → `QuizAttempt` | Graded answers                             |
| `Exercise`                          | Test cases + submissions                   |
| `Achievement` → `UserAchievement`   | Many-to-many                               |
| `Session`                           | Refresh token store, rotated on each use   |
| `Certificate`                       | Verifiable via unique code                 |

---

## API Reference

**Base URL:** `http://localhost:3000/v1`

<details>
<summary><strong>Auth</strong></summary>

| Method | Endpoint         | Auth   | Description                   |
| ------ | ---------------- | ------ | ----------------------------- |
| `POST` | `/auth/register` | —      | Register + set refresh cookie |
| `POST` | `/auth/login`    | —      | Login + set refresh cookie    |
| `POST` | `/auth/refresh`  | cookie | Rotate refresh token          |
| `POST` | `/auth/logout`   | cookie | Revoke session                |
| `GET`  | `/auth/me`       | Bearer | Current user                  |

</details>

<details>
<summary><strong>Courses & Progress</strong></summary>

| Method | Endpoint                       | Auth     | Description               |
| ------ | ------------------------------ | -------- | ------------------------- |
| `GET`  | `/courses`                     | optional | All published courses     |
| `GET`  | `/courses/:slug`               | optional | Course with lessons       |
| `GET`  | `/courses/:slug/lessons/:id`   | optional | Lesson + quiz + exercises |
| `POST` | `/progress/:lessonId/start`    | Bearer   | Mark in-progress          |
| `POST` | `/progress/:lessonId/complete` | Bearer   | Mark complete + award XP  |
| `GET`  | `/progress`                    | Bearer   | Full progress map         |
| `GET`  | `/progress/streak`             | Bearer   | Streak info               |

</details>

<details>
<summary><strong>Quiz, Profile & AI</strong></summary>

| Method  | Endpoint             | Auth     | Description                |
| ------- | -------------------- | -------- | -------------------------- |
| `GET`   | `/quiz/:lessonId`    | Bearer   | Quiz (answers hidden)      |
| `POST`  | `/quiz/:id/attempt`  | Bearer   | Submit + grade answers     |
| `GET`   | `/quiz/leaderboard`  | —        | Top 50 by XP               |
| `GET`   | `/profile/:username` | optional | Public profile             |
| `PATCH` | `/profile`           | Bearer   | Update own profile         |
| `POST`  | `/ai/hint`           | Bearer   | AI hint / explain / review |

</details>

<details>
<summary><strong>Admin</strong></summary>

| Method | Endpoint         | Auth  | Description         |
| ------ | ---------------- | ----- | ------------------- |
| `GET`  | `/admin/stats`   | Admin | Platform stats      |
| `GET`  | `/admin/users`   | Admin | Paginated user list |
| `POST` | `/admin/courses` | Admin | Create course       |
| `POST` | `/admin/lessons` | Admin | Create lesson       |

</details>

---

## Deployment

> **Catatan Alur CI/CD:** Keputusan otomatisasi workflow deployment final di `.github/workflows/deploy.yml` sedang ditinjau pada audit Fase 1 (Butir H). Berikut panduan manual/platform integration yang valid:

### Frontend → Vercel

```bash
# Connect GitHub repo ke Vercel, lalu set environment variable:
VITE_API_URL=https://api.jscraft.dev/v1

# Build command:  npx turbo run build --filter=@jscraft/web
# Atau:           npm run build -w @jscraft/web
# Output dir:     apps/web/dist
```

### Backend → Railway

```bash
# Connect GitHub repo ke Railway
# Set semua env vars dari apps/api/.env.example
# Pre-deploy / Release command: npx prisma migrate deploy
# Start command:                npm run start -w @jscraft/api
```

### Database → Railway PostgreSQL

```bash
# Tambahkan PostgreSQL plugin di Railway
# Salin DATABASE_URL ke env vars API service
# Migrasi schema otomatis berjalan via release command di atas (prisma migrate deploy)
```

---

## Security

- **Passwords** — bcrypt (cost 12)
- **JWT** — opaque refresh token in httpOnly cookie; signed access token (15 min)
- **Refresh rotation** — setiap penggunaan menghasilkan token pair baru
- **Code execution** — iframe sandbox di sisi browser (`allow-scripts` only, no DOM access); runner server dinonaktifkan secara bawaan (`ENABLE_CODE_RUNNER=false`) demi keamanan
- **Rate limiting**
  - Global: 100 req/15 min per IP (kecuali `/health`)
  - Login: dual limiter (`skipSuccessfulRequests: true`) — 10 gagal/15 min per IP+email dan 200 gagal/15 min per IP
  - Register: 60 req/jam per IP (mendukung jaringan NAT/WiFi kelas bersama)
  - Refresh token: 120 req/15 min per IP
  - Forgot password: 5 req/jam per IP+email
  - Reset password: 10 req/15 min per IP
  - AI routes: 30 req/15 min per user
- **Input validation** — Zod pada semua API endpoints
- **SQL injection** — Prisma parameterized queries
- **Headers** — Helmet.js (CSP, HSTS, X-Frame-Options)
- **CORS** — origin whitelist only

---

## Roadmap

### Phase 1 — Foundation [Selesai] (Current)

- [x] Monorepo setup (Turborepo)
- [x] Full TypeScript frontend + backend
- [x] Authentication (JWT + refresh rotation)
- [x] Database schema (Prisma + PostgreSQL)
- [x] Week 1 curriculum (7 lessons seeded)
- [x] Lesson page with Monaco editor
- [x] Sandboxed code execution (iframe)
- [x] XP + level gamification
- [x] Streak tracking
- [x] Quiz system with grading
- [x] Dashboard with progress visualization
- [x] Admin panel foundation
- [x] CI/CD (GitHub Actions)

### Phase 2 — Full Curriculum

- [ ] Migrate all 42 lessons from bootcamp repo
- [ ] Exercise test runner (isolated-vm)
- [ ] Email verification + reset password flow
- [ ] Leaderboard (live updates)
- [ ] Certificate PDF generation
- [ ] Notes system per lesson
- [ ] Bookmarks

### Phase 3 — AI + Community

- [ ] AI coding assistant (Claude API, streaming)
- [ ] AI code review
- [ ] Community comments per lesson
- [ ] Personalized learning path
- [ ] Playground sharing (public URLs)
- [ ] Multiplayer coding rooms

---

## Contributing

Contributions are welcome! Silakan buka issue terlebih dahulu untuk mendiskusikan perubahan yang ingin dilakukan.

1. Fork repository ini
2. Buat feature branch — `git checkout -b feat/nama-fitur`
3. Commit perubahan — `git commit -m 'feat: tambahkan fitur x'`
4. Push ke branch — `git push origin feat/nama-fitur`
5. Buka Pull Request

---

## License

[MIT](LICENSE) © 2026 [Jouqio](https://github.com/Jouqio)
