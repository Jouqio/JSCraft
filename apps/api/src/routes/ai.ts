import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { aiRateLimit } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';

const router = Router();
router.use(authenticate, aiRateLimit);

const hintSchema = z.object({
  lessonId:    z.string(),
  userCode:    z.string().max(5000),
  description: z.string().max(500),
  mode:        z.enum(['hint', 'explain', 'review']),
});

// POST /v1/ai/hint
router.post('/hint', validateBody(hintSchema), async (req, res, next) => {
  try {
    if (!env.ANTHROPIC_API_KEY) {
      throw new AppError(503, 'AI_UNAVAILABLE', 'Fitur AI belum aktif');
    }

    const { userCode, description, mode } = req.body as z.infer<typeof hintSchema>;

    const prompts: Record<string, string> = {
      hint:    `Berikan SATU petunjuk singkat (tanpa spoiler) untuk membantu menyelesaikan latihan ini. Kode user: \`\`\`js\n${userCode}\n\`\`\` Deskripsi latihan: ${description}`,
      explain: `Jelaskan apa yang dilakukan kode ini dalam Bahasa Indonesia yang mudah dipahami pemula: \`\`\`js\n${userCode}\n\`\`\``,
      review:  `Review kode ini dan berikan feedback konstruktif tentang: kualitas kode, potensi bug, dan cara perbaikan. Bahasa Indonesia: \`\`\`js\n${userCode}\n\`\`\``,
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompts[mode] }],
        system: 'Kamu adalah asisten belajar JavaScript untuk pemula Indonesia. Jawab singkat, jelas, dan dalam Bahasa Indonesia.',
      }),
    });

    const data = await response.json() as any;
    const text = data.content?.[0]?.text ?? 'Maaf, tidak dapat memproses permintaan.';

    res.json({ success: true, data: { response: text, mode } });
  } catch (err) { next(err); }
});

export default router;
