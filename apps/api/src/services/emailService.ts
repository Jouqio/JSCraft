import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: env.SMTP_USER
    ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
    : undefined,
});

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export const emailService = {
  async send({ to, subject, html }: MailOptions) {
    if (!env.SMTP_HOST) {
      console.log(`[email] SMTP not configured — would send to ${to}: ${subject}`);
      return;
    }
    await transporter.sendMail({
      from: env.SMTP_FROM ?? 'noreply@jscraft.dev',
      to, subject, html,
    });
  },

  async sendPasswordReset(to: string, resetLink: string) {
    await this.send({
      to,
      subject: 'Reset Password JSCraft',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#f59e0b;">Reset Password JSCraft</h2>
          <p>Kamu meminta untuk mereset password akun JSCraft-mu.</p>
          <p>Klik tombol di bawah untuk membuat password baru:</p>
          <a href="${resetLink}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Reset Password
          </a>
          <p style="color:#94a3b8;font-size:13px;">
            Link ini berlaku selama 1 jam. Jika kamu tidak meminta reset password, abaikan email ini.
          </p>
        </div>
      `,
    });
  },

  async sendWelcome(to: string, displayName: string) {
    await this.send({
      to,
      subject: 'Selamat datang di JSCraft! 🚀',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#f59e0b;">Halo, ${displayName}! 👋</h2>
          <p>Selamat datang di <strong>JSCraft</strong> — platform belajar JavaScript untuk developer Indonesia.</p>
          <p>Kamu sudah terdaftar dan siap mulai belajar. Yuk mulai dari pelajaran pertama!</p>
          <a href="${env.FRONTEND_URL}/courses" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Mulai Belajar →
          </a>
        </div>
      `,
    });
  },
};
