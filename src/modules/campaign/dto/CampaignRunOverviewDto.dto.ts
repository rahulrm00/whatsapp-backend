export class CampaignRunOverviewDto {
  campaign!: {
        totalCampaigns: number;
        activeCampaigns: number;
        completedCampaigns: number;
        failedCampaigns: number;
         draftCampaigns: number;
    scheduledCampaigns: number;
    runningCampaigns: number;
    };

  contacts!: {
    totalContacts: number;
    pendingCount: number;
    queuedCount: number;
    sentCount: number;
    deliveredCount: number;
    readCount: number;
    failedCount: number;
  };

  rates!: {
    deliveryRate: number;
    readRate: number;
    failureRate: number;
  };

  billing!: {
    utilityMessages: number;
    marketingMessages: number;
    authenticationMessages: number;

    utilityAmount: number;
    marketingAmount: number;
    authenticationAmount: number;

    totalAmount: number;
  };
}