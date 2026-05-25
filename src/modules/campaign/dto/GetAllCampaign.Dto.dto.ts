import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

import { Transform } from 'class-transformer';

import { CampaignStatus } from '@common/enum/campaign-status.enum';

export class GetAllCampaignDto {
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
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}