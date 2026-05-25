
import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

import { Transform } from 'class-transformer';

import { TemplateCategory } from '@common/enum/template-category.enum';
import { TemplateStatus } from '@common/enum/template-status.enum';

export class GetAllTemplatesDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumberString()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumberString()
  limit?: number = 10;
}