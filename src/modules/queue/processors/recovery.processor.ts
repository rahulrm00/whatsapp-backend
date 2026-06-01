import {
  CampaignContact,
  CampaignContactDocument,
} from '@modules/campaign/schemas/campaign-contact.schema';
import {
  CampaignRun,
  CampaignRunDocument,
} from '@modules/campaign/schemas/campaign-run.schema';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CampaignQueueService } from '../services/campaign-queue.service';
import { CampaignContactStatus } from '@common/enum/campaigncontact-status.enum';
import { CampaignRunStatus } from '@common/enum/campaignrun-status.enum';

@Processor('campaign-recovery-queue')
export class RecoveryProcessor extends WorkerHost {
  constructor(
    @InjectModel(CampaignContact.name)
    private readonly campaignContactModel: Model<CampaignContactDocument>,

    @InjectModel(CampaignRun.name)
    private readonly campaignRunModel: Model<CampaignRunDocument>,

    private readonly campaignQueueService: CampaignQueueService,
  ) {
    super();
  }

  async process() {
    console.log('RECOVERY JOB STARTED');

    const cutoff = new Date(Date.now() - 15 * 60 * 1000);

    await this.recoverContacts(cutoff);

    await this.recoverCampaigns(cutoff);

    console.log('RECOVERY JOB COMPLETED');
  }
  private async recoverCampaigns(cutoff: Date) {
    const stuckCampaigns = await this.campaignRunModel.find({
      status:{ $in: [
        CampaignRunStatus.RUNNING,
        CampaignRunStatus.FAILED,
      ],
    },

      startedAt: {
        $lt: cutoff,
      },

      isDeleted: false,
    });

    for (const campaign of stuckCampaigns) {
      const pendingCount = await this.campaignContactModel.countDocuments({
        campaignRunId: campaign._id,

        status: CampaignContactStatus.PENDING,
      });

      if (pendingCount > 0) {
        await this.campaignRunModel.findByIdAndUpdate(campaign._id, {
          status: CampaignRunStatus.QUEUED,
        });

        await this.campaignQueueService.addCampaignJob(campaign._id.toString());

        console.log(`Requeued Campaign: ${campaign._id}`);
      } else {
        await this.campaignRunModel.findByIdAndUpdate(campaign._id, {
          status: CampaignRunStatus.COMPLETED,

          completedAt: new Date(),
        });
      }
    }
  }
  private async recoverContacts(cutoff: Date) {
    const result = await this.campaignContactModel.updateMany(
      {
        status: CampaignContactStatus.PROCESSING,

        processingAt: {
          $lt: cutoff,
        },

        isDeleted: false,
      },
      {
        status: CampaignContactStatus.PENDING,

        processingAt: null,
      },
    );

    console.log(`Recovered Contacts: ${result.modifiedCount}`);
  }
}
