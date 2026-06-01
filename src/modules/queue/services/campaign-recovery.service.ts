import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";

@Injectable()
export class CampaignRecoveryService
  implements OnModuleInit
{
  constructor(
    @InjectQueue('campaign-recovery-queue')
    private readonly recoveryQueue: Queue,
  ) {}

  async onModuleInit() {

    await this.recoveryQueue.add(
      'recover-stuck-jobs',
      {},
      {
        repeat: {
          every: 10 * 60 * 1000,
        },

        jobId:
          'recover-stuck-jobs',

        removeOnComplete: true,
      },
    );

    console.log(
      'Recovery Job Registered',
    );
  }
}