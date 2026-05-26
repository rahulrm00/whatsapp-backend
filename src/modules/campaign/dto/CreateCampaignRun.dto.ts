import {
  IsEnum,
  IsMongoId,
  IsOptional,
} from 'class-validator';

import { CampaignRunType } from '@common/enum/campaign-runtype.enum';

export class CreateCampaignRunDto {
  @IsMongoId()
  campaignId!: string;

  @IsMongoId()
  templateId!: string;

  @IsOptional()
  @IsEnum(CampaignRunType)
  runType?: CampaignRunType;
}