import {
  IsMongoId,
} from 'class-validator';

export class UploadCampaignContactsDto {

  @IsMongoId()
  campaignRunId!: string;
}