import {
  IsDateString,
  IsEnum,
  IsOptional,
} from 'class-validator';

import { CampaignRunType } from '@common/enum/campaign-runtype.enum';

export class UpdateCampaignRunDto {
  @IsEnum(CampaignRunType)
  runType!: CampaignRunType;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}