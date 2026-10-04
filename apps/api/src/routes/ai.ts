import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { aiRateLimit } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';

const router = Router();

const hintSchema = z.object({
  lessonId: z.string().min(1, 'lessonId wajib diisi').max(100, 'lessonId maksimal 100 karakter'),
  userCode: z.string().max(5000, 'userCode maksimal 5000 karakter'),
  description: z.string().max(500, 'description maksimal 500 karakter'),
  mode: z.enum(['hint', 'explain', 'review']),
});

// POST /v1/ai/hint
// Middleware order: authenticate -> aiRateLimit -> validateBody -> handler
router.post(
  '/hint',
  authenticate,
  aiRateLimit,
  validateBody(hintSchema),
  async (req, res, next) => {
    try {
      const apiKey = env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new AppError(503, 'AI_UNAVAILABLE', 'Fitur AI belum aktif');
      }

      const { userCode, description, mode } = req.body as z.infer<typeof hintSchema>;
      const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

      const prompts: Record<string, string> = {
        hint: `Berikan SATU petunjuk singkat (tanpa spoiler) untuk membantu menyelesaikan latihan ini. Kode user: \`\`\`js\n${userCode}\n\`\`\` Deskripsi latihan: ${description}`,
        explain: `Jelaskan apa yang dilakukan kode ini dalam Bahasa Indonesia yang mudah dipahami pemula: \`\`\`js\n${userCode}\n\`\`\``,
        review: `Review kode ini dan berikan feedback konstruktif tentang: kualitas kode, potensi bug, dan cara perbaikan. Bahasa Indonesia: \`\`\`js\n${userCode}\n\`\`\``,
      };

      let response: Response;
      try {
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: 512,
            messages: [{ role: 'user', content: prompts[mode] }],
            system:
              'Kamu adalah asisten belajar JavaScript untuk pemula Indonesia. Jawab singkat, jelas, dan dalam Bahasa Indonesia.',
          }),
          signal: AbortSignal.timeout(10000), // 10s timeout
        });
      } catch (fetchErr: any) {
        if (fetchErr?.name === 'TimeoutError' || fetchErr?.name === 'AbortError') {
          throw new AppError(
            504,
            'AI_TIMEOUT',
            'Permintaan ke asisten AI memakan waktu terlalu lama. Silakan coba lagi.'
          );
        }
        throw new AppError(
          502,
          'AI_NETWORK_ERROR',
          'Layanan AI sedang tidak dapat dijangkau. Coba beberapa saat lagi.'
        );
      }

      if (!response.ok) {
        if (response.status === 429) {
          throw new AppError(
            429,
            'AI_RATE_LIMITED',
            'Layanan AI sedang sibuk. Coba beberapa saat lagi.'
          );
        }
        if (response.status >= 500) {
          throw new AppError(
            502,
            'AI_UPSTREAM_ERROR',
            'Layanan AI sedang tidak dapat dijangkau. Coba beberapa saat lagi.'
          );
        }
        throw new AppError(502, 'AI_SERVICE_ERROR', 'Gagal memproses permintaan AI.');
      }

      const data = (await response.json()) as any;
      const text = data.content?.[0]?.text ?? 'Maaf, tidak dapat memproses permintaan.';

      res.json({ success: true, data: { response: text, mode } });
    } catch (err) {
      if (err instanceof AppError) {
        return next(err);
      }
      // Sanitized log: never log request headers or raw upstream error details that might contain the API key
      console.error(
        '[AI] Hint processing failed:',
        err instanceof Error ? err.name : 'Unknown error'
      );
      next(new AppError(500, 'AI_ERROR', 'Terjadi kesalahan pada layanan AI.'));
    }
  }
);

export default router;
