import { Module } from '@nestjs/common';
import { MetaWebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { BullModule } from '@nestjs/bullmq';
import { WebhookProcessor } from './webhook.processor';
import { CampaignModule } from '@modules/campaign/campaign.module';
import { TemplatesModule } from '@modules/templates/templates.module';

@Module({
  imports: [ BullModule.registerQueue({
      name: 'meta-webhook',
    }),
    CampaignModule,
    TemplatesModule
  ],
  controllers: [MetaWebhookController],
  providers: [WebhookService,WebhookProcessor],
})
export class WebhookModule {}
