import { Injectable } from '@nestjs/common';

import { InjectQueue } from '@nestjs/bullmq';

import { Queue } from 'bullmq';

@Injectable()
export class CampaignQueueService {
  constructor(
    @InjectQueue('campaign-queue')
    private readonly campaignQueue: Queue,
  ) {}

  async addCampaignJob(
  campaignRunId: string,
  delay = 0,
) {

  await this.campaignQueue.add(
    'send-campaign',

    {
      campaignRunId,
    },

    {
      delay,

      attempts: 5,

      backoff: {
        type: 'exponential',
        delay: 5000,
      },

      removeOnComplete: 1000,

      removeOnFail: 5000,
    },
  );

  console.log(
    `JOB ADDED - Delay: ${delay} ms`,
  );
}
}
