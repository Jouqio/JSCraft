import { Router } from 'express';
import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// GET /v1/certificates/:code — public verify endpoint
router.get('/:code', async (req, res, next) => {
  try {
    const cert = await prisma.certificate.findUnique({
      where: { verifyCode: req.params.code },
      include: {
        user: {
          select: { username: true, displayName: true },
        },
      },
    });

    if (!cert) {
      throw new AppError(404, 'CERTIFICATE_NOT_FOUND', 'Sertifikat tidak ditemukan');
    }

    res.json({
      success: true,
      data: {
        username:    cert.user.username,
        displayName: cert.user.displayName,
        courseSlug:  cert.courseSlug,
        issuedAt:    cert.issuedAt.toISOString(),
        verifyCode:  cert.verifyCode,
      },
    });
  } catch (err) { next(err); }
});

export default router;
