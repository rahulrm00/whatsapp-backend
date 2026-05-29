import { Controller, Post } from '@nestjs/common';
import { CampaignQueueService } from './services/campaign-queue.service';

@Controller('queue')
export class QueueController {

  constructor(

    private readonly campaignQueueService:CampaignQueueService,
  ) {}

  @Post('/v1/test')
  async testQueue() {

    await this.campaignQueueService
      .addCampaignJob(
        'RUN001',
      );

    return {
      message:
        'Job added successfully',
    };
  }
}