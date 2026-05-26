import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

import { Transform } from 'class-transformer';
import { CampaignRunStatus } from '@common/enum/campaignrun-status.enum';

export class GetAllCampaignRunDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumberString()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumberString()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CampaignRunStatus)
  status?: CampaignRunStatus;
}