import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { QueueModule } from './modules/queue/queue.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from './common/redis/redis.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [WhatsappModule ,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
     MongooseModule.forRootAsync({
      inject: [ConfigService],

      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    
 BullModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('REDIS_URL'),
        },
      }),
    }),

    AuthModule,
    UsersModule,
    ContactsModule,
    CampaignModule,
    TemplatesModule,
    QueueModule,
    WebhookModule,
    AnalyticsModule,
    RedisModule,
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
