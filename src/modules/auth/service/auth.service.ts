import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from '../dto/RegisterRequestDto.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  AuthProvider,
  AuthProviderDocument,
} from '../schemas/auth-provider.schema';
import { Connection, Model } from 'mongoose';
import { Counter, CounterDocument } from '../schemas/counter.schema';
import { hashJti } from '@common/utils/hash-jti';
import { UserRole } from '@common/enum/user-role.enum';
import { UsersService } from '@modules/users/users.service';
import { LoginDto } from '../dto/LoginDto.dto';
import { RedisKeys } from '@common/keys/redis.constants';
import { RedisService } from '@common/redis/redis.service';
import { JwtService } from '../config/JwtService';
import { IssueTokensAndCreateSessionDto } from '../dto/IssueTokensAndCreateSessionDto.dto';
import { SignTokensRequestDto } from '../dto/SignTokensRequestDto.dto';
import { SignTokensResponseDto } from '../dto/SignTokensResponseDto.dto';
import { ActivesessionService } from './active-session.service';
import { ActiveSession } from '../schemas/active-session.schema';
import { IssueTokensAndCreateSessionResponseDto } from '../dto/IssueTokensAndCreateSessionResponseDto.dto';
import { LoginResponseDto } from '../dto/LoginResponseDto.dto';
import { GetTokenDto } from '../dto/GetTokenDto.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectModel(AuthProvider.name)
    private readonly authProviderModel: Model<AuthProviderDocument>,
    @InjectModel(Counter.name)
    private readonly counterModel: Model<CounterDocument>,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly usersService: UsersService,
    private readonly redis: RedisService,
    private readonly JwtService: JwtService,
    private readonly activeSession: ActivesessionService,
  ) {}

  async register(body: RegisterDto): Promise<string> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const email = body.email.toLowerCase().trim();
      const username = body.username.toLowerCase().trim();
      const existingAuthProvider = await this.authProviderModel
        .findOne({
          $or: [{ email }, { username }],
          isDeleted: false,
        })
        .session(session);
      if (existingAuthProvider) {
        if (existingAuthProvider.email === email) {
          throw new ConflictException('Email already exists');
        }

        if (existingAuthProvider.username === username) {
          throw new ConflictException('Username already exists');
        }
      }
      const counter = await this.counterModel.findOneAndUpdate(
        {
          name: 'USER',
        },
        {
          $inc: {
            seq: 1,
          },
        },
        {
          new: true,
          upsert: true,
          session,
        },
      );

      const userId = `USR${String(counter.seq).padStart(5, '0')}`;
      await this.usersService.createUser({
        userId,
        name: body.name,
        email,
        username,
      });
      const hashedPassword = await hashJti(body.password);
      const newAuthProvider = new this.authProviderModel({
        userId,
        username,
        email,
        password: hashedPassword,
        role: UserRole.ADMIN,
      });

      await newAuthProvider.save({ session });
      await session.commitTransaction();
      return 'User registered successfully';
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async login(body: LoginDto): Promise<LoginResponseDto> {
    try {
      const username = body.username?.toLowerCase().trim();

      if (!username || !body.password) {
        throw new BadRequestException('Username and password are required');
      }

      const authProvider = await this.authProviderModel
        .findOne({
          username,
          isDeleted: false,
        })
        .select('+password')
        .lean();

      if (!authProvider) {
        throw new UnauthorizedException('Invalid username or password');
      }

      const hashedPassword = await hashJti(body.password);

      const isPasswordValid = hashedPassword === authProvider.password;

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid username or password');
      }

      const token = await this.issueTokensAndCreateSession({
        userId: authProvider.userId.toString(),
        userName: authProvider.username,
        email: authProvider.email,
        role: authProvider.role,

        deviceId: body.deviceId || 'unknown',
        ipAddress: body.ipAddress || 'unknown',
        userAgent: body.userAgent || 'unknown',
        appVersion: body.appVersion || 'unknown',
      });

      await this.authProviderModel.updateOne(
        { _id: authProvider._id },
        {
          $set: {
            lastLoginAt: new Date(),
          },
        },
      );

      return {
        message: 'Login successful',

        accessToken: token.accessToken,
        refreshToken: token.refreshToken,

        accessExp: token.accessExp,
        refreshExp: token.refreshExp,

        username: authProvider.username,
        email: authProvider.email,
      };
    } catch (error: any) {
      this.logger.error(`Login error: ${error.message}`, error.stack);

      throw error;
    }
  }
  async getSignToken(
    req: SignTokensRequestDto,
  ): Promise<SignTokensResponseDto> {
    const { subject, audience, accessTtlSec, refreshTtlSec, deviceId, claims } =
      req;
    const access = await this.JwtService.signAccessToken(claims || {}, {
      sub: subject!,
      aud: audience!,
      ttlSec: accessTtlSec!,
      deviceId,
    });

    const refresh = await this.JwtService.signRefreshToken({
      sub: subject!,
      aud: audience!,
      ttlSec: refreshTtlSec!,
      deviceId,
    });

    return {
      accessToken: access.jwt,
      refreshToken: refresh.jwt,
      kid: this.JwtService.getKid(),
      accessJti: access.jti,
      refreshJti: refresh.jti,
      accessExp: access.exp,
      refreshExp: refresh.exp,
    };
  }

  async issueTokensAndCreateSession(
    user: IssueTokensAndCreateSessionDto,
  ): Promise<IssueTokensAndCreateSessionResponseDto> {
    const uid = user.userId;

    const claims: Record<string, string> = {
      name: user?.userName ?? '',
      email: user?.email ?? '',
      phone: user?.phoneNumber ?? '',
      role: user?.role ?? 'CUSTOMER',
    };

    const signResp = await this.getSignToken({
      subject: uid,
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_DEFAULT_AUD,
      claims,
      accessTtlSec: Number(process.env.ACCESS_TTL) || 60 * 15,
      refreshTtlSec: Number(process.env.REFRESH_TTL) || 60 * 60 * 24 * 30,
      deviceId: user.deviceId,
    });

    const refreshJti = signResp.refreshJti;
    const refreshExp =
      Number(signResp.refreshExp) ||
      Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
    const ttl = refreshExp - Math.floor(Date.now() / 1000);

    const hashedRefresh = hashJti(refreshJti!);
    const hashedAccess = hashJti(signResp.accessJti!);

    const accessTtl = Number(process.env.ACCESS_TTL) || 60 * 15;

    await Promise.all([
      this.redis.set(
        RedisKeys.accessCurrent(uid, user.deviceId),
        hashedAccess,
        accessTtl,
      ),
      this.redis.set(
        RedisKeys.refreshCurrent(uid, user.deviceId),
        hashedRefresh,
        ttl,
      ),
      this.redis.sadd(RedisKeys.devices(uid), user.deviceId),
      this.redis.del(RedisKeys.revokedUser(uid)),
    ]);

    this.logger.debug(
      `✅ Cleared global revoked timestamp for user ${user.userId}`,
    );

    const activeSessionData = {
      userId: uid,
      deviceId: user.deviceId,
      accessTokenJti: signResp.accessJti,
      refreshTokenJti: refreshJti,
      loginAt: new Date(),
      lastAccessedAt: new Date(),
      logoutAt: null,
      ipAddress: user.ipAddress || 'unknown',
      userAgent: user.userAgent || 'unknown',
      isRevoked: false,
      revokedAt: null,
      metadata: {
        country: user.country || 'unknown',
        appVersion: user.appVersion || 'unknown',
      },
    };

    await this.activeSession.createActiveSession(
      activeSessionData as ActiveSession,
    );
    this.logger.debug(
      `✅ Active session created for user ${uid} on device ${user.deviceId}`,
    );

    const updatedSession = await this.activeSession.getFullActiveSession(
      uid,
      user.deviceId,
    );
    await this.cacheActiveSession(updatedSession);

    return {
      accessToken: signResp.accessToken!,
      refreshToken: signResp.refreshToken!,
      accessExp: accessTtl,
      refreshExp: ttl,
    };
  }

  async getToken(body: GetTokenDto): Promise<SignTokensResponseDto> {
    const verifyResp = await this.JwtService.verifyToken(
      body.refreshToken,
      process.env.JWT_DEFAULT_AUD,
    );

    if (!verifyResp.ok) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = verifyResp.payload;

    const uid = payload.sub ?? payload['sub'];
    const jti = payload.jti ?? payload['jti'];

    const iat = Number(payload.iat);
    const typ = payload.typ ?? '';

    if (typ !== 'refresh') {
      throw new UnauthorizedException('Token is not a refresh token');
    }

    let session: any = null;

    try {
      const sessionJson = await this.redis.get(
        RedisKeys.activeSession(uid, body.deviceId || 'unknown'),
      );

      session =
        typeof sessionJson === 'string' ? JSON.parse(sessionJson) : sessionJson;

      if (!session) {
        this.logger.warn(
          `No active session in cache for uid=${uid}, deviceId=${body.deviceId || 'unknown'}`,
        );
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Redis session retrieval failed: ${errMsg}`);
    }

    if (!session) {
      session = await this.activeSession.getFullActiveSession(
        uid,
        body.deviceId || 'unknown',
      );
    }

    if (!session) {
      throw new UnauthorizedException('Active session not found');
    }

    let revokedTimestamp = 0;

    try {
      const revokedTimestampStr = await this.redis.get(
        RedisKeys.revokedUser(uid),
      );
      revokedTimestamp = revokedTimestampStr ? Number(revokedTimestampStr) : 0;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Redis revoked timestamp fetch failed: ${errMsg}`);

      revokedTimestamp = session.revokedAt
        ? Math.floor(new Date(session.revokedAt).getTime() / 1000)
        : 0;
    }

    if (iat < revokedTimestamp) {
      throw new UnauthorizedException('Token globally revoked');
    }

    let storedHash: string | null = null;

    try {
      storedHash = await this.redis.get(
        RedisKeys.refreshCurrent(uid, body.deviceId || 'unknown'),
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Redis refresh hash retrieval failed: ${errMsg}`);

      storedHash = hashJti(session.refreshTokenJti);
    }

    if (!storedHash) {
      await this.revokeAllForUser(uid);
      throw new UnauthorizedException(
        'Refresh token invalid or missing — re-login required',
      );
    }

    const incomingHash = hashJti(jti);

    let isBlacklisted: string | null = null;

    try {
      isBlacklisted = await this.redis.get(
        RedisKeys.refreshBlacklist(incomingHash),
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Redis blacklist check failed: ${errMsg}`);
    }

    if (isBlacklisted === '1') {
      if (storedHash !== incomingHash) {
        await this.handleRefreshReuse(uid, body.deviceId || 'unknown');
        throw new UnauthorizedException(
          'Token reuse detected — all sessions revoked',
        );
      }
      throw new UnauthorizedException('Refresh token blacklisted');
    }

    if (storedHash !== incomingHash) {
      await this.revokeAllForUser(uid);
      throw new UnauthorizedException(
        'Refresh token mismatch — re-login required',
      );
    }

    const newResp = await this.getSignToken({
      subject: uid,
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_DEFAULT_AUD,
      claims: {
        name: payload.name ?? '',
        email: payload.email ?? '',
        phone: payload.phone ?? '',
        role: payload.role ?? 'CUSTOMER',
      },
      accessTtlSec: Number(process.env.ACCESS_TTL || 60 * 15),
      refreshTtlSec: Number(process.env.REFRESH_TTL || 60 * 60 * 24 * 30),
      deviceId: body.deviceId || 'unknown',
    });

    if (
      !newResp.accessToken ||
      !newResp.refreshToken ||
      !newResp.accessJti ||
      !newResp.refreshJti
    ) {
      throw new InternalServerErrorException('Failed to generate new tokens');
    }

    const newRefreshJti = newResp.refreshJti;
    const newAccessJti = newResp.accessJti;

    const oldHashed = storedHash;
    const newHashed = hashJti(newRefreshJti);
    const newAccessHashed = hashJti(newAccessJti);

    const refreshTtl = Math.max(
      Number(newResp.refreshExp) - Math.floor(Date.now() / 1000),
      1,
    );

    const accessTtl = Number(process.env.ACCESS_TTL) || 60 * 15;

    await this.activeSession.updateRefreshJti({
      userId: uid,
      deviceId: body.deviceId || 'unknown',
      accessTokenJti: newAccessJti,
      refreshTokenJti: newRefreshJti,
    });

    await Promise.all([
      this.redis.set(
        RedisKeys.refreshCurrent(uid, body.deviceId || 'unknown'),
        newHashed,
        refreshTtl,
      ),
      this.redis.set(RedisKeys.refreshBlacklist(oldHashed!), '1', refreshTtl),
      this.redis.set(
        RedisKeys.accessCurrent(uid, body.deviceId || 'unknown'),
        newAccessHashed,
        accessTtl,
      ),
    ]);

    const updatedSession = await this.activeSession.getFullActiveSession(
      uid,
      body.deviceId || 'unknown',
    );

    await this.cacheActiveSession(updatedSession);

    return {
      accessToken: newResp.accessToken,
      refreshToken: newResp.refreshToken,
      accessExp: newResp.accessExp,
      refreshExp: newResp.refreshExp,
    };
  }

  async revoke(uid: string, jti?: string, deviceId?: string): Promise<boolean> {
    try {
      if (jti) {
        const hashed = hashJti(jti);
        await this.redis.set(
          RedisKeys.refreshBlacklist(hashed),
          '1',
          60 * 60 * 24 * 30,
        );
      }

      if (deviceId) {
        await Promise.all([
          this.redis.del(RedisKeys.refreshCurrent(uid, deviceId)),
          this.redis.del(RedisKeys.accessCurrent(uid, deviceId)),
          this.redis.srem(RedisKeys.devices(uid), deviceId),
          this.activeSession.revokeForSingleUSer(uid, deviceId),
        ]);

        const updatedSession = await this.activeSession.getFullActiveSession(
          uid,
          deviceId,
        );
        await this.cacheActiveSession(updatedSession);
      }

      return true;
    } catch (err: any) {
      this.logger.error(`Failed to revoke tokens: ${err.message}`);
      throw new InternalServerErrorException('Token revocation failed');
    }
  }

  private async handleRefreshReuse(uid: string, deviceId: string) {
    // Strong action: revoke all refresh tokens for user
    await this.revokeAllForUser(uid);
    // Optionally send security email/push, create security incident record
    this.logger.warn(
      `Refresh token reuse detected for uid=${uid}, deviceId=${deviceId}`,
    );
  }

  async revokeAllForUser(uid: string): Promise<boolean> {
    try {
      const revokeTimestamp = String(Date.now());
      await this.redis.set(
        RedisKeys.revokedUser(uid),
        revokeTimestamp,
        60 * 60 * 24 * 365,
      );

      const devices = await this.redis.smembers(RedisKeys.devices(uid));

      await Promise.all(
        devices.map(async (deviceId) => {
          await Promise.all([
            this.redis.del(RedisKeys.refreshCurrent(uid, deviceId)),
            this.redis.del(RedisKeys.accessCurrent(uid, deviceId)),
            this.redis.srem(RedisKeys.devices(uid), deviceId),
            this.activeSession.revokeForSingleUSer(uid, deviceId),
          ]);

          const updatedSession = await this.activeSession.getFullActiveSession(
            uid,
            deviceId,
          );
          await this.cacheActiveSession(updatedSession);
        }),
      );

      return true;
    } catch (err: any) {
      this.logger.error(
        `Failed to revoke all sessions for user ${uid}: ${err.message}`,
      );
      throw new InternalServerErrorException('Complete user revocation failed');
    }
  }
  async cacheActiveSession(data: ActiveSession): Promise<void> {
    const key = RedisKeys.activeSession(data.userId, data.deviceId);
    const ttlSeconds = 60 * 60 * 24 * 30;

    try {
      await this.redis.set(key, JSON.stringify(data), ttlSeconds);
    } catch (err: any) {
      this.logger.error(
        'Failed to cache active session in Redis: ' + err.message,
      );
    }
  }
}
