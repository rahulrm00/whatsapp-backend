import { Module } from '@nestjs/common';
import { CampaignController } from './controller/campaign.controller';
import { CampaignService } from './services/campaign.service';
import { CampaignContactService } from './services/campaign-contact.service';
import { CampaignSchedulerService } from './services/campaign-scheduler.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import { CampaignRun, CampaignRunSchema } from './schemas/campaign-run.schema';
import { CampaignContact, CampaignContactSchema } from './schemas/campaign-contact.schema';
import { TemplatesModule } from '../templates/templates.module';
import { CampaignRunService } from './services/campaign-run.service';
import { CampaignRunController } from './controller/campaign-run.controller';
import { CampaignContactController } from './controller/campaign-contact.controller';
import { QueueModule } from '@modules/queue/queue.module';

@Module({
  imports: [
    MongooseModule.forFeature([
              {
                name: Campaign.name,
                schema: CampaignSchema,
              },
              {
                name: CampaignRun.name,
                schema: CampaignRunSchema,
              },
              {
                name: CampaignContact.name,
                schema: CampaignContactSchema
              }
            ]),
            TemplatesModule,QueueModule
  ],
  controllers: [CampaignController,CampaignRunController,CampaignContactController],
  providers: [CampaignService,CampaignContactService,CampaignSchedulerService,CampaignRunService],
  exports: [CampaignContactService,CampaignRunService]
})
export class CampaignModule {}
