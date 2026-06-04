import { Module } from '@nestjs/common';

import { BullModule } from '@nestjs/bullmq';


import { CampaignQueueService } from './services/campaign-queue.service';

import { CampaignProcessor } from './processors/campaign.processor';
import { QueueController } from './queue.controller';
import {
  CampaignContact,
  CampaignContactSchema,
} from '@modules/campaign/schemas/campaign-contact.schema';
import {
  CampaignRun,
  CampaignRunSchema,
} from '@modules/campaign/schemas/campaign-run.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplatesModule } from '@modules/templates/templates.module';
import { WhatsappModule } from '@modules/whatsapp/whatsapp.module';
import { CampaignRecoveryService } from './services/campaign-recovery.service';
import { RecoveryProcessor } from './processors/recovery.processor';
import { CampaignMetaMedia, CampaignMetaMediaSchema } from '@modules/campaign/schemas/campaignmeta-media.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CampaignContact.name,
        schema: CampaignContactSchema,
      },
      {
        name: CampaignRun.name,
        schema: CampaignRunSchema,
      },
      {
        name:CampaignMetaMedia.name,
        schema: CampaignMetaMediaSchema,
      }
    ]),
    BullModule.registerQueue({
      name: 'campaign-queue',
    },
    {
      name: 'campaign-recovery-queue',
    }
  ),
    TemplatesModule,
    WhatsappModule,
  ],
  controllers: [QueueController],
  providers: [CampaignQueueService, CampaignProcessor,CampaignRecoveryService,RecoveryProcessor],
  exports: [CampaignQueueService],
})
export class QueueModule {}
