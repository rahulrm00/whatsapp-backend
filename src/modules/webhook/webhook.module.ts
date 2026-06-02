import { Module } from '@nestjs/common';
import { MetaWebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { BullModule } from '@nestjs/bullmq';
import { WebhookProcessor } from './webhook.processor';
import { CampaignModule } from '@modules/campaign/campaign.module';

@Module({
  imports: [ BullModule.registerQueue({
      name: 'meta-webhook',
    }),
    CampaignModule,
  ],
  controllers: [MetaWebhookController],
  providers: [WebhookService,WebhookProcessor],
})
export class WebhookModule {}
