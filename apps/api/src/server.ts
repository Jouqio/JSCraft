import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import cron from 'node-cron';

import { env }           from './config/env.js';
import { connectDB, disconnectDB } from './config/database.js';
import { errorHandler }  from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { globalRateLimit } from './middleware/rateLimit.js';

import authRouter         from './routes/auth.js';
import coursesRouter      from './routes/courses.js';
import progressRouter     from './routes/progress.js';
import quizRouter         from './routes/quiz.js';
import exercisesRouter    from './routes/exercises.js';
import profileRouter      from './routes/profile.js';
import adminRouter        from './routes/admin.js';
import aiRouter           from './routes/ai.js';
import certificatesRouter from './routes/certificates.js';
import { streakService }  from './services/streakService.js';

const app = express();

// ── Security ───────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:     ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
}));

// ── CORS ────────────────────────────────────────────────────
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body & utilities ────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(compression() as express.RequestHandler);

// ── Logging ─────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Rate limiting ───────────────────────────────────────────
app.use(globalRateLimit);

// ── Health check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV, ts: new Date().toISOString() });
});

// ── API v1 ──────────────────────────────────────────────────
const v1 = express.Router();
v1.use('/auth',         authRouter);
v1.use('/courses',      coursesRouter);
v1.use('/progress',     progressRouter);
v1.use('/quiz',         quizRouter);
v1.use('/exercises',    exercisesRouter);
v1.use('/profile',      profileRouter);
v1.use('/admin',        adminRouter);
v1.use('/ai',           aiRouter);
v1.use('/certificates', certificatesRouter);

app.use('/v1', v1);

// ── Error handling ──────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Cron jobs ────────────────────────────────────────────────
// Midnight WIB (UTC+7 = 17:00 UTC) — reset broken streaks
cron.schedule('0 17 * * *', async () => {
  try {
    const count = await streakService.resetExpiredStreaks();
    if (count > 0) console.log(`[cron] Reset ${count} expired streaks`);
  } catch (err) {
    console.error('[cron] streak reset failed:', err);
  }
});

// ── Startup ─────────────────────────────────────────────────
async function main() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`\n🚀  JSCraft API`);
    console.log(`    http://localhost:${env.PORT}/v1`);
    console.log(`    ENV: ${env.NODE_ENV}\n`);
  });

  const shutdown = async (sig: string) => {
    console.log(`\n[${sig}] Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    // Force exit after 10s if server hasn't closed
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('uncaughtException',  (err) => { console.error('Uncaught:', err); process.exit(1); });
  process.on('unhandledRejection', (err) => { console.error('Unhandled rejection:', err); process.exit(1); });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

export default app;
