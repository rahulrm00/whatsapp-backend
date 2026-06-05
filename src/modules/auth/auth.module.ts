import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './service/auth.service';
import { ActivesessionService } from './service/active-session.service';
import { UsersModule} from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthProvider, AuthProviderSchema } from './schemas/auth-provider.schema';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { ActiveSession, ActiveSessionSchema } from './schemas/active-session.schema';
import { RedisModule } from '@common/redis/redis.module';
import { JwtService } from './config/JwtService';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
@Module({
  imports: [UsersModule ,RedisModule,
     PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
     MongooseModule.forFeature([
          {
            name: AuthProvider.name,
            schema: AuthProviderSchema,
          },
          {
            name: Counter.name,
            schema: CounterSchema,
          },
          {
            name: ActiveSession.name,
            schema: ActiveSessionSchema
          }
        ]),
        
  ],
  controllers: [AuthController],
  providers: [AuthService, ActivesessionService,JwtService, JwtStrategy,],
  exports:[JwtStrategy,PassportModule]
})
export class AuthModule {}
