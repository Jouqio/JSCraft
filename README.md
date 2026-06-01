<div align="center">
  <h1>⚡ JSCraft</h1>
  <p><strong>Platform belajar JavaScript interaktif untuk developer Indonesia</strong></p>
  <p>
    <a href="#tech-stack">Tech Stack</a> · 
    <a href="#quick-start">Quick Start</a> · 
    <a href="#structure">Structure</a> · 
    <a href="#deployment">Deployment</a>
  </p>
</div>

---

## 🎯 Overview

JSCraft adalah platform EdTech full-stack untuk belajar JavaScript dari nol sampai siap kerja. Terinspirasi dari freeCodeCamp, Codecademy, dan Scrimba — dengan UI modern dan konten Bahasa Indonesia.

**Features:**
- 📖 42 hari kurikulum terstruktur (3 fase, 6 minggu)
- 🖥️ Live code editor (Monaco) dengan sandbox aman
- ⚡ Sistem XP, level, dan streak gamifikasi
- 🏆 Kuis interaktif dengan leaderboard
- 🎯 Latihan dengan test cases
- 👤 Auth JWT dengan refresh token rotation
- 🌙 Dark / Light mode
- 📱 Responsive mobile-first
- 🔒 Role-based access (Student / Admin)
- 📜 Verifiable certificates
- 🤖 AI coding assistant (Claude API)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, TypeScript 5 |
| Styling | Tailwind CSS v3 + custom design tokens |
| State | Zustand v4 (persist + devtools) |
| Animation | Framer Motion |
| Editor | Monaco Editor (VS Code engine) |
| Routing | React Router v6 |
| Backend | Node.js 20, Express 4, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (RS256 access + opaque refresh, httpOnly cookie) |
| Email | Nodemailer (Resend/SMTP) |
| AI | Anthropic Claude API |
| Monorepo | Turborepo + npm workspaces |
| CI/CD | GitHub Actions → Vercel (web) + Railway (API) |

---

## ⚡ Quick Start

### Prerequisites
- Node.js ≥ 20.0.0
- PostgreSQL ≥ 15
- npm ≥ 10.0.0

### 1. Clone & Install
```bash
git clone https://github.com/your-org/jscraft.git
cd jscraft
npm install
```

### 2. Environment Setup
```bash
# API
cp apps/api/.env.example apps/api/.env
# Edit: DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# Web
cp apps/web/.env.example apps/web/.env
```

### 3. Generate JWT secrets
```bash
# Run twice — use one for ACCESS, one for REFRESH
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Database Setup
```bash
cd apps/api

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed database (creates demo users + Week 1 content)
npm run db:seed
```

### 5. Start Development
```bash
# From project root — starts both web (5173) and api (3000)
npm run dev
```

**URLs:**
- 🌐 Web: http://localhost:5173
- ⚙️ API: http://localhost:3000/v1
- 🔍 Prisma Studio: http://localhost:5555 (run `npm run db:studio`)

### Demo Accounts
| Role | Email | Password |
|------|-------|---------|
| Admin | admin@jscraft.dev | Admin@123456 |
| Student | budi@example.com | Student@123 |

---

## 📁 Project Structure

```
jscraft/                      # Turborepo monorepo root
├── apps/
│   ├── web/                  # React + Vite frontend (@jscraft/web)
│   │   └── src/
│   │       ├── components/   # Reusable UI components
│   │       │   ├── ui/       # Button, Input, Badge, Modal, Spinner
│   │       │   ├── layout/   # Navbar, RootLayout
│   │       │   ├── editor/   # CodeEditor, ConsoleOutput, RunButton
│   │       │   ├── lesson/   # QuizBlock
│   │       │   └── dashboard/# ProgressRing, XPBar, StreakCalendar
│   │       ├── features/     # Feature-specific logic
│   │       ├── hooks/        # useAuth, useProgress, useEditor, ...
│   │       ├── lib/          # api.ts, utils.ts, xp.ts, validators.ts
│   │       ├── pages/        # Route-level page components
│   │       ├── router/       # Router config + guards
│   │       ├── store/        # Zustand stores (auth, progress, editor, theme)
│   │       └── styles/       # globals.css (Tailwind + design tokens)
│   │
│   └── api/                  # Express + Prisma backend (@jscraft/api)
│       ├── prisma/           # schema.prisma + seed.ts + migrations/
│       └── src/
│           ├── config/       # env.ts (Zod), database.ts (Prisma)
│           ├── middleware/   # auth.ts, errorHandler.ts, rateLimit.ts, validate.ts
│           ├── routes/       # auth, courses, progress, quiz, exercises, profile, admin, ai
│           ├── services/     # authService, xpService, streakService, progressService, emailService
│           ├── utils/        # response.ts, crypto.ts
│           └── server.ts     # Express app + graceful shutdown
│
└── packages/
    ├── types/                # Shared TypeScript types (@jscraft/types)
    └── content/              # Lesson MDX content files
```

---

## 🗄️ Database Schema

Key models:
- **User** — auth, XP, level, streak
- **Course** → **Lesson** (content as JSON, starterCode, solutionCode)
- **Progress** — per user/lesson, unique constraint
- **Quiz** → **Question** → **QuizAttempt** (graded answers)
- **Exercise** (test cases) → submissions
- **Achievement** → **UserAchievement** (many-to-many)
- **Session** (refresh token store, rotated on each use)
- **Certificate** (verifiable via unique code)

Full schema: `apps/api/prisma/schema.prisma`

---

## 🔌 API Reference

Base URL: `http://localhost:3000/v1`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register + set refresh cookie |
| POST | `/auth/login` | — | Login + set refresh cookie |
| POST | `/auth/refresh` | cookie | Rotate refresh token |
| POST | `/auth/logout` | cookie | Revoke session |
| GET | `/auth/me` | Bearer | Current user |
| GET | `/courses` | optional | All published courses |
| GET | `/courses/:slug` | optional | Course with lessons |
| GET | `/courses/:slug/lessons/:id` | optional | Lesson + quiz + exercises |
| POST | `/progress/:lessonId/start` | Bearer | Mark in-progress |
| POST | `/progress/:lessonId/complete` | Bearer | Mark complete + award XP |
| GET | `/progress` | Bearer | Full progress map |
| GET | `/progress/streak` | Bearer | Streak info |
| GET | `/quiz/:lessonId` | Bearer | Quiz (answers hidden) |
| POST | `/quiz/:id/attempt` | Bearer | Submit + grade answers |
| GET | `/quiz/leaderboard` | — | Top 50 by XP |
| GET | `/profile/:username` | optional | Public profile |
| PATCH | `/profile` | Bearer | Update own profile |
| POST | `/ai/hint` | Bearer | AI hint/explain/review |
| GET | `/admin/stats` | Admin | Platform stats |
| GET | `/admin/users` | Admin | Paginated user list |
| POST | `/admin/courses` | Admin | Create course |
| POST | `/admin/lessons` | Admin | Create lesson |

---

## 🚀 Deployment

### Frontend → Vercel
```bash
# Connect GitHub repo to Vercel
# Set environment variables in Vercel dashboard:
VITE_API_URL=https://api.jscraft.dev/v1

# Build command: npm run build --filter=@jscraft/web
# Output: apps/web/dist
```

### Backend → Railway
```bash
# Connect GitHub repo to Railway
# Set all env vars from apps/api/.env.example
# Railway auto-detects Node.js + runs: npm run start --filter=@jscraft/api
```

### Database → Railway PostgreSQL
```bash
# Add PostgreSQL plugin in Railway
# Copy DATABASE_URL to API service env vars
# Railway runs Prisma migrations automatically via:
# RAILWAY_RUN_UID=0 npx prisma migrate deploy
```

---

## 🗺️ Development Roadmap

### ✅ Phase 1 — Foundation (Current)
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

### 🔄 Phase 2 — Full Curriculum
- [ ] Migrate all 42 lessons from bootcamp repo
- [ ] Exercise test runner (isolated-vm)
- [ ] Email verification + reset password flow
- [ ] Leaderboard (live updates)
- [ ] Certificate PDF generation
- [ ] Notes system per lesson
- [ ] Bookmarks

### 🔮 Phase 3 — AI + Community
- [ ] AI coding assistant (Claude API, streaming)
- [ ] AI code review
- [ ] Community comments per lesson
- [ ] Personalized learning path
- [ ] Playground sharing (public URLs)
- [ ] Multiplayer coding rooms

---

## 🔐 Security

- Passwords: bcrypt (cost 12)
- JWT: opaque refresh token in httpOnly cookie; signed access token (15min)
- Refresh rotation: every use issues a new token pair
- Code execution: iframe sandbox (`allow-scripts` only, no DOM access)
- Rate limiting: 100 req/15min global, 10 req/15min auth routes
- Input validation: Zod on all API endpoints
- SQL injection: Prisma parameterized queries
- Headers: Helmet.js (CSP, HSTS, X-Frame-Options)
- CORS: origin whitelist only

---

## 📄 License

MIT © 2025 JSCraft Team

Built with ❤️ untuk developer Indonesia.
