import { CampaignContactStatus } from "@common/enum/campaigncontact-status.enum";

export const STATUS_RANK = {
  [CampaignContactStatus.PENDING]: 1,
  [CampaignContactStatus.QUEUED]: 2,
  [CampaignContactStatus.PROCESSING]: 3,
  [CampaignContactStatus.SENT]: 4,
  [CampaignContactStatus.DELIVERED]: 5,
  [CampaignContactStatus.READ]: 6,
  [CampaignContactStatus.FAILED]: 99,
};