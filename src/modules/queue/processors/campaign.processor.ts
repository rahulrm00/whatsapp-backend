import { Processor, WorkerHost } from '@nestjs/bullmq';

import { Job } from 'bullmq';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import {
  CampaignContact,
  CampaignContactDocument,
} from '../../campaign/schemas/campaign-contact.schema';

import {
  CampaignRun,
  CampaignRunDocument,
} from '../../campaign/schemas/campaign-run.schema';

import { CampaignContactStatus } from '@common/enum/campaigncontact-status.enum';
import { TemplatesService } from '@modules/templates/services/templates.service';
import { WhatsappService } from '@modules/whatsapp/whatsapp.service';
import { MetaTemplateBuilder } from '@modules/whatsapp/builders/MetaTemplateBuilder.builder';
import { CampaignRunStatus } from '@common/enum/campaignrun-status.enum';
import { CampaignMetaMedia, CampaignMetaMediaDocument } from '@modules/campaign/schemas/campaignmeta-media.schema';

@Processor('campaign-queue')
export class CampaignProcessor extends WorkerHost {
  constructor(
    @InjectModel(CampaignContact.name)
    private readonly campaignContactModel: Model<CampaignContactDocument>,

    @InjectModel(CampaignRun.name)
    private readonly campaignRunModel: Model<CampaignRunDocument>,

    @InjectModel(CampaignMetaMedia.name) private readonly campaignMetaMediaModel: Model<CampaignMetaMediaDocument>,

    private readonly templatesService: TemplatesService,
    private readonly metaTemplateBuilder: MetaTemplateBuilder,
    private readonly whatsappService: WhatsappService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<void> {
    console.log('================================');
    console.log('JOB RECEIVED');
    console.log('================================');

    const { campaignRunId } = job.data;

    try {
      const campaignRun = await this.campaignRunModel.findByIdAndUpdate(
        campaignRunId,
        {
          status: 'RUNNING',
          startedAt: new Date(),
        },
        {
          new: true,
        },
      );

      if (!campaignRun) {
        throw new Error('Campaign Run not found');
      }

      const template = await this.templatesService.getTemplateById(
        campaignRun.templateId.toString(),
      );

      if (!template) {
        throw new Error('Template not found');
      }

      const BATCH_SIZE = 100;

      while (true) {
        const contacts = await this.campaignContactModel
          .find({
            campaignRunId,
            status: CampaignContactStatus.PENDING,
            isDeleted: false,
          })
          .limit(BATCH_SIZE);

        if (!contacts.length) {
          break;
        }

        for (const contact of contacts) {
          try {
            console.log('Processing:', contact.phone);

            await this.campaignContactModel.findByIdAndUpdate(contact._id, {
              status: CampaignContactStatus.PROCESSING,

              processingAt: new Date(),
            });

            let metaMediaId: string | null = null;

            if (campaignRun.mediaId) {
              const media = await this.campaignMetaMediaModel.findById(
                campaignRun.mediaId,
              );

              metaMediaId = media?.metaMediaId ?? null;
            }

            const customFields = contact.customFields || {};

            if (campaignRun.mediaId) {
              customFields.metaMediaId = metaMediaId;
            }

            const payload = this.metaTemplateBuilder.build(
              template.data,
              customFields,
            );

            const response = await this.whatsappService.sendTemplate(
              contact.phone,
              payload,
            );

            const wamid = response?.messages?.[0]?.id || '';

            await this.campaignContactModel.findByIdAndUpdate(contact._id, {
              status: CampaignContactStatus.SENT,

              sentAt: new Date(),

              wamid,
            });

            await this.campaignRunModel.findByIdAndUpdate(campaignRunId, {
              $inc: {
                pendingCount: -1,
                sentCount: 1,
              },
            });

            console.log('SENT:', contact.phone);
          } catch (error: any) {
            if (this.isRetryableError(error)) {
              const retryCount = (contact.retryCount || 0) + 1;

              const MAX_RETRIES = 5;

              if (retryCount >= MAX_RETRIES) {
                await this.campaignContactModel.findByIdAndUpdate(contact._id, {
                  retryCount,

                  status: CampaignContactStatus.FAILED,

                  failedAt: new Date(),

                  failureReason:
                    error?.response?.data?.error?.message ||
                    error?.message ||
                    'Maximum retries exceeded',
                });

                await this.campaignRunModel.findByIdAndUpdate(campaignRunId, {
                  $inc: {
                    pendingCount: -1,
                    failedCount: 1,
                  },
                });

                continue;
              }

              await this.campaignContactModel.findByIdAndUpdate(contact._id, {
                retryCount,

                status: CampaignContactStatus.PENDING,

                processingAt: null,

                failureReason:
                  error?.response?.data?.error?.message || error?.message,
              });

              console.warn(
                `Retry ${retryCount}/${MAX_RETRIES} for ${contact.phone}`,
              );

              throw error; // Let BullMQ retry entire job
            }

            // Permanent failure
            await this.campaignContactModel.findByIdAndUpdate(contact._id, {
              status: CampaignContactStatus.FAILED,

              failedAt: new Date(),

              failureReason:
                error?.response?.data?.error?.message || error?.message,
            });

            await this.campaignRunModel.findByIdAndUpdate(campaignRunId, {
              $inc: {
                pendingCount: -1,
                failedCount: 1,
              },
            });
          }
        }
      }
      const campaignRunstats =
        await this.campaignRunModel.findById(campaignRunId);

      if (
        campaignRunstats &&
        campaignRunstats.sentCount + campaignRunstats.failedCount >=
          campaignRunstats.totalContacts
      ) {
        await this.campaignRunModel.findByIdAndUpdate(campaignRunId, {
          status: CampaignRunStatus.COMPLETED,

          completedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('JOB FAILED:', error);

      if (!this.isRetryableError(error)) {
        await this.campaignRunModel.findByIdAndUpdate(campaignRunId, {
          status: CampaignRunStatus.FAILED,
        });
      }

      throw error;
    }
  }
  private isRetryableError(error: any): boolean {
    const status = error?.status || error?.response?.status;

    return [
      429,

      500,

      502,

      503,

      504,
    ].includes(status);
  }
}
