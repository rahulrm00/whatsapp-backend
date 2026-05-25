import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { TemplateCategory }
  from '@common/enum/template-category.enum';

import { TemplateParameterFormat }
  from '@common/enum/template-parameterformat.enum';

export class TemplateComponentDto {

  @IsString()
  @IsNotEmpty()
  @Matches(
    /^(HEADER|BODY|FOOTER|BUTTONS)$/,
    {
      message:
        'Component type must be HEADER, BODY, FOOTER or BUTTONS',
    },
  )
  type!: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsObject()
  example?: Record<string, any>;
}

export class CreateTemplateDto {

  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(512)
  @Matches(
    /^[a-z0-9_]+$/,
    {
      message:
        'Template name must contain lowercase letters, numbers and underscores only',
    },
  )
  name!: string;

  @IsEnum(
    TemplateCategory,
    {
      message:
        'Invalid template category',
    },
  )
  category!: TemplateCategory;

  @IsString()
  @IsNotEmpty()
  language!: string;

  @IsEnum(
    TemplateParameterFormat,
    {
      message:
        'Invalid parameter format',
    },
  )
  parameterFormat!: TemplateParameterFormat;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({
    each: true,
  })
  @Type(
    () => TemplateComponentDto,
  )
  components!: TemplateComponentDto[];

  @IsOptional()
  @IsArray()
  @IsString({
    each: true,
  })
  variables?: string[];

  @IsOptional()
  @IsString()
  createdBy?: string;
}