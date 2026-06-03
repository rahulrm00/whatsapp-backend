import { Processor, WorkerHost } from '@nestjs/bullmq';

import { Job } from 'bullmq';

import { Logger } from '@nestjs/common';

import { WebhookService } from './webhook.service';

@Processor('meta-webhook')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly webhookService: WebhookService) {
    super();
  }

 async process(
  job: Job<any>,
): Promise<void> {
  try {
    const change =
      job.data?.entry?.[0]?.changes?.[0];

    if (!change) {
      this.logger.warn(
        `Invalid webhook payload. JobId=${job.id}`,
      );
      return;
    }

    const field = change.field;

    switch (field) {
      case 'messages': {
        const statuses =
          change.value?.statuses ?? [];

        if (!statuses.length) {
          this.logger.warn(
            `No message statuses found. JobId=${job.id}`,
          );
          return;
        }

        this.logger.log(
          `Processing ${statuses.length} message status update(s). JobId=${job.id}`,
        );

        await Promise.all(
          statuses.map((status: any) =>
            this.webhookService.handleStatusUpdate(
              status,
            ),
          ),
        );

        break;
      }

      case 'message_template_status_update': {
        this.logger.log(
          `Processing template status update. JobId=${job.id}`,
        );

        await this.webhookService.handleTemplateStatusUpdate(
          change.value,
        );

        break;
      }

      default:
        this.logger.warn(
          `Unsupported webhook field: ${field}. JobId=${job.id}`,
        );
    }

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
