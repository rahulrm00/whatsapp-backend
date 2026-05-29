export class UploadCampaignContactsResponseDto {

  message!: string;

  totalRows!: number;

  successCount!: number;

  failedCount!: number;

  missingColumns!: string[];

  failedRows!: {
    row: number;
    reason: string;
  }[];
}