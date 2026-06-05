import { Injectable, Logger } from '@nestjs/common';
import { SignJWT, importPKCS8, importSPKI, exportJWK, jwtVerify } from 'jose';
import { randomUUID } from 'crypto';

@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);
  private readonly alg = 'RS256';
  private readonly kid: string;
  private readonly privateKeyPem: string;
  private readonly publicKeyPem: string;
  private readonly issuer: string;

  constructor() {
    this.privateKeyPem = (process.env.JWT_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    this.publicKeyPem = (process.env.JWT_PUBLIC_KEY || '').replace(/\\n/g, '\n');
    this.kid = process.env.JWT_KID || 'kid-1';
    this.issuer = process.env.JWT_ISSUER || 'your.company.auth';

    if (!this.privateKeyPem || !this.publicKeyPem) {
      throw new Error('JWT key material is required in env');
    }
  }

  async signAccessToken(
  claims: Record<string, any>,
  opts: { sub: string; aud: string; ttlSec: number; deviceId?: string }
   ) {
  const pk = await importPKCS8(this.privateKeyPem, this.alg);
  const now = Math.floor(Date.now() / 1000);
  const jti = randomUUID();

  const payload = {
    ...claims,
    deviceId: opts.deviceId ?? 'unknown',
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: this.alg, kid: this.kid })
    .setIssuer(this.issuer)
    .setSubject(opts.sub)
    .setAudience(opts.aud)
    .setIssuedAt(now)
    .setExpirationTime(now + opts.ttlSec)
    .setJti(jti)
    .sign(pk);

  return { jwt: token, jti, exp: now + opts.ttlSec };
  }


  async signRefreshToken(opts: { sub: string; aud: string; ttlSec: number; deviceId?: string; }) {
    const claims = { typ: 'refresh' };
    return this.signAccessToken(claims, opts);
  }

  async publicJwks() {
    const pub = await importSPKI(this.publicKeyPem, this.alg);
    const jwk = await exportJWK(pub);
    return { keys: [{ ...jwk, alg: this.alg, kid: this.kid, use: 'sig', kty: 'RSA' }] };
  }

  async verifyToken(token: string, audience?: string) {
  try {
    const pub = await importSPKI(this.publicKeyPem, this.alg);

    const { payload, protectedHeader } = await jwtVerify(token, pub, {
      issuer: this.issuer,
      audience,
    });

    const payloadMap: Record<string, string> = {};
    for (const [key, value] of Object.entries(payload)) {
      payloadMap[key] =
        typeof value === "string" ? value : JSON.stringify(value);
    }

    return {
      ok: true,
      payload: payloadMap,
      kid: protectedHeader.kid ?? "", // no need for `as string`
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : JSON.stringify(err);
    this.logger.warn("Token verify failed", message);

    return { ok: false, payload: {}, kid: "" };
  }
}

  getKid() : string{
     return this.kid;
  }
}
