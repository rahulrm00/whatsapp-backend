import { createHmac } from "crypto";

export function hashJti(jti: string) {
  const secret = process.env["REFRESH_JTI_HASH_SECRET"] || 'fallback-secret';
  return createHmac('sha256', secret).update(jti).digest('hex');
}