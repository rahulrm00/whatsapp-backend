import { CampaignRunDocument } from '../schemas/campaign-run.schema';
import { CampaignRunResponseDto } from '../dto/CampaignRunResponse.dto';

export class CampaignRunMapper {
  static toResponse(
    doc: CampaignRunDocument,
  ): CampaignRunResponseDto {
    return {
      id: doc._id.toString(),
      campaignId: doc.campaignId.toString(),

      templateId: doc.templateId.toString(),

      runType: doc.runType,
      status: doc.status,

      scheduledAt: doc.scheduledAt,
      startedAt: doc.startedAt,
      completedAt: doc.completedAt,

      totalContacts: doc.totalContacts,

      pendingCount: doc.pendingCount,
      queuedCount: doc.queuedCount,

      sentCount: doc.sentCount,
      deliveredCount: doc.deliveredCount,
      readCount: doc.readCount,
      failedCount: doc.failedCount,

      failureReason: doc.failureReason,

      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}