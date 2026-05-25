import { Module } from '@nestjs/common';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './services/campaign.service';
import { CampaignContactService } from './services/campaign-contact.service';
import { CampaignSchedulerService } from './services/campaign-scheduler.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import { CampaignRun, CampaignRunSchema } from './schemas/campaign-run.schema';
import { CampaignContact, CampaignContactSchema } from './schemas/campaign-contact.schema';

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
  ],
  controllers: [CampaignController],
  providers: [CampaignService,CampaignContactService,CampaignSchedulerService],
})
export class CampaignModule {}
