import crypto from 'crypto';

/** Generate a cryptographically random token */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/** Hash a plain token for DB storage (NOT for passwords — use bcrypt for those) */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Compare plain token against hashed one */
export function compareToken(plain: string, hashed: string): boolean {
  return hashToken(plain) === hashed;
}
