import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';

import { Reflector } from '@nestjs/core';

import { RedisService } from '../../../common/redis/redis.service';

import { hashJti } from '../../../common/utils/hash-jti';

import { RedisKeys } from '../../../common/keys/redis.constants';

import { ROLES_KEY } from '../../../common/decorators/roles.decorator';

import { ActivesessionService } from '../service/active-session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  private readonly publicKey: string;

  constructor(
    private readonly redis: RedisService,

    // private readonly reflector: Reflector,

    private readonly activeSessionService: ActivesessionService,
  ) {
    const publicKey = (process.env.JWT_PUBLIC_KEY || '').replace(/\\n/g, '\n');

    if (!publicKey) {
      throw new Error('JWT_PUBLIC_KEY missing');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: publicKey,

      algorithms: ['RS256'],

      passReqToCallback: true,
    });

    this.publicKey = publicKey;
  }

  async validate(request: Request, decoded: any) {
    try {
      if (!decoded.sub || !decoded.iat) {
        throw new UnauthorizedException('Invalid token payload structure');
      }

      const revokedTimestampStr = await this.redis.get(
        RedisKeys.revokedUser(decoded.sub),
      );

      const revokedTimestamp = revokedTimestampStr
        ? Number(revokedTimestampStr)
        : 0;

      if (revokedTimestamp && decoded.iat < revokedTimestamp) {
        throw new UnauthorizedException('Token is globally revoked');
      }

      // const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      //   ROLES_KEY,
      //   [request['route']?.stack?.[0]?.method],
      // );

      // if (requiredRoles && requiredRoles.length > 0) {
      //   const userRole = decoded.role;

      //   if (!userRole || !requiredRoles.includes(userRole)) {
      //     throw new UnauthorizedException('Insufficient role');
      //   }
      // }

      if (decoded.jti) {
        const incomingHashed = hashJti(decoded.jti);

        const redisKey = RedisKeys.accessCurrent(decoded.sub, decoded.deviceId);

        const currentHashed = await this.redis.get(redisKey).catch((err) => {
          this.logger.warn(
            `Redis failure during token validation: ${err.message}`,
          );

          return null;
        });

        if (currentHashed) {
          if (currentHashed !== incomingHashed) {
            throw new UnauthorizedException('Token has been revoked');
          }
        } else {
          const session = await this.activeSessionService.getActiveSession({
            userId: decoded.sub,

            deviceId: decoded.deviceId,
          });

          if (!session || typeof session.isRevoked === 'undefined') {
            throw new UnauthorizedException('Invalid session');
          }

          const dbAccessJti = hashJti(session.accessTokenJti || '');

          if (incomingHashed !== dbAccessJti) {
            throw new UnauthorizedException('Token revoked');
          }

          if (session.isRevoked) {
            throw new UnauthorizedException('Token revoked');
          }
        }
      }

      await this.activeSessionService.updateLastAccessed({
        userId: decoded.sub,

        deviceId: decoded.deviceId,

        timestamp: new Date(),
      });

      return decoded;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      }

      if (err instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }

      throw err;
    }
  }
}
