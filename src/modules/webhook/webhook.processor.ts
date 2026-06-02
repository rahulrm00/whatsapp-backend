import {
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';

import { Job } from 'bullmq';

import { Logger } from '@nestjs/common';

import { WebhookService } from './webhook.service';

@Processor('meta-webhook')
export class WebhookProcessor extends WorkerHost {
  private readonly logger =
    new Logger(WebhookProcessor.name);

  constructor(
    private readonly webhookService: WebhookService,
  ) {
    super();
  }

  async process(
    job: Job<any>,
  ): Promise<void> {
    try {
      const statuses =
        job.data?.entry?.[0]
          ?.changes?.[0]
          ?.value?.statuses ?? [];

      if (!statuses.length) {
        this.logger.warn(
          `No statuses found in webhook payload. JobId=${job.id}`,
        );
        return;
      }

      this.logger.log(
        `Processing ${statuses.length} status update(s). JobId=${job.id}`,
      );

      await Promise.all(
        statuses.map((status) =>
          this.webhookService.handleStatusUpdate(
            status,
          ),
        ),
      );

      this.logger.log(
        `Webhook processing completed. JobId=${job.id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Webhook processing failed. JobId=${job.id}`,
        error?.stack,
      );

      throw error;
    }
  }
}