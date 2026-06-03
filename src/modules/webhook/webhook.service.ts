import { CampaignContactStatus } from '@common/enum/campaigncontact-status.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { Request } from 'express';
import { STATUS_RANK } from './constants/MetaMessageStatus.constants';
import { CampaignContactService } from '@modules/campaign/services/campaign-contact.service';
import { CampaignRunService } from '@modules/campaign/services/campaign-run.service';
import { TemplatesService } from '@modules/templates/services/templates.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly metaVerifyToken: string;
  private readonly appSecret: string;
  constructor(
    @InjectQueue('meta-webhook')
    private readonly webhookQueue: Queue,
    private readonly campaignContactService: CampaignContactService,
    private readonly campaignRunService: CampaignRunService,
    private readonly templateService: TemplatesService,
  ) {
    this.metaVerifyToken =
      process.env.META_VERIFY_TOKEN || 'default-verify-token';
    this.appSecret = process.env.META_APP_SECRET || 'default-app-secret';
  }

  verify(mode: string, token: string, challenge: string) {
    if (mode !== 'subscribe' || token !== this.metaVerifyToken) {
      throw new UnauthorizedException('Webhook verification failed');
    }

    return challenge;
  }

  async receive(req: Request): Promise<void> {
    const enabled = process.env.WEBHOOK_SIGNATURE_ENABLED === 'true';

    if (enabled) {
      const signature = req.headers['x-hub-signature-256'] as string;

      if (!signature) {
        throw new UnauthorizedException('Missing signature');
      }

      const valid = this.verifySignature(
        Buffer.from(JSON.stringify(req.body)),
        signature,
      );

      if (!valid) {
        throw new UnauthorizedException('Invalid signature');
      }
    }
    await this.webhookQueue.add('meta-webhook', req.body, {
      attempts: 5,

      backoff: {
        type: 'exponential',
        delay: 5000,
      },

      removeOnComplete: 1000,

      removeOnFail: 5000,
    });
  }

  private verifySignature(rawBody: Buffer, signature: string): boolean {
    const expected =
      'sha256=' +
      crypto.createHmac('sha256', this.appSecret).update(rawBody).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  }

  private mapMetaStatus(metaStatus: string): CampaignContactStatus | null {
    switch (metaStatus?.toLowerCase()) {
      case 'sent':
        return CampaignContactStatus.SENT;

      case 'delivered':
        return CampaignContactStatus.DELIVERED;

      case 'read':
        return CampaignContactStatus.READ;

      case 'failed':
        return CampaignContactStatus.FAILED;

      default:
        return null;
    }
  }
  async handleTemplateStatusUpdate(
  payload: any,
): Promise<void> {
  this.logger.log(
    `Template Status Update: ${payload.event}`,
  );

  const template =
    await this.templateService.templateGetByMetaId(
      payload.message_template_id
    );

  if (!template) {
    this.logger.warn(
      `Template not found: ${payload.message_template_id}`,
    );
    return;
  }

  await this.templateService.updateTemplateStatus(
    template._id.toString(),
    payload.event,
    payload.reason,
  );
  this.logger.log(
    `Template updated successfully: ${template.name}`,
  );
}



  async handleStatusUpdate(metaStatus: any): Promise<void> {
    const wamid = metaStatus.id;

    const newStatus = this.mapMetaStatus(metaStatus.status);

    if (!newStatus) {
      return;
    }

    const recipient = await this.campaignContactService.findOneByWamid(wamid);

    if (!recipient) {
      console.warn(`Recipient not found for ${wamid}`);
      return;
    }

    const currentRank = STATUS_RANK[recipient.status] || 0;

    const newRank = STATUS_RANK[newStatus] || 0;

    if (currentRank >= newRank) {
      return;
    }

    const updateData: any = {
      status: newStatus,
    };

    switch (newStatus) {
      case CampaignContactStatus.SENT:
        updateData.sentAt = new Date();
        break;

      case CampaignContactStatus.DELIVERED:
        updateData.deliveredAt = new Date();
        break;

      case CampaignContactStatus.READ:
        updateData.readAt = new Date();
        break;

      case CampaignContactStatus.FAILED:
        updateData.failedAt = new Date();

        updateData.errorCode = metaStatus.errors?.[0]?.code;

        updateData.errorMessage = metaStatus.errors?.[0]?.title;

        break;
    }
    await this.campaignContactService.updateStatus(
      recipient._id.toString(),
      updateData,
    );
    await this.updateStats(recipient.campaignRunId.toString(), newStatus);
  }

  async updateStats(campaignRunId: string, status: CampaignContactStatus) {
    const update: any = {};

    switch (status) {
      case CampaignContactStatus.SENT:
        update.sentCount = 1;
        break;

      case CampaignContactStatus.DELIVERED:
        update.deliveredCount = 1;
        break;

      case CampaignContactStatus.READ:
        update.readCount = 1;
        break;

      case CampaignContactStatus.FAILED:
        update.failedCount = 1;
        break;
    }

    await this.campaignRunService.updateCampaignRunStats(campaignRunId, update);
  }
}
