export class CampaignRunResponseDto {
  id!: string;

  campaignId!: string;

  campaignName?: string;

  templateName?: string;

  templateId!: string;

  runType!: string;

  status!: string;

  scheduledAt?: Date | null;

  startedAt?: Date | null;

  completedAt?: Date | null;

  totalContacts!: number;

  pendingCount!: number;

  queuedCount!: number;

  sentCount!: number;

  deliveredCount!: number;

  readCount!: number;

  failedCount!: number;

  failureReason?: string;

  createdAt!: Date;

  updatedAt!: Date;
}