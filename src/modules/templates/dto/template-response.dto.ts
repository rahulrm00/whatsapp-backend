import { TemplateStatus }
  from '@common/enum/template-status.enum';

import { TemplateCategory }
  from '@common/enum/template-category.enum';

import { TemplateParameterFormat }
  from '@common/enum/template-parameterformat.enum';

export class TemplateResponseDto {

  id!: string;

  tenantId!: string;

  metaTemplateId!: string;

  name!: string;

  category!: TemplateCategory;

  language!: string;

  parameterFormat!:
    TemplateParameterFormat;

  status!: TemplateStatus;

  components!: Record<string, any>[];

  variables!: string[];
  mediaId?: string | null;

  createdBy!: string;

  createdAt!: Date;

  updatedAt!: Date;
}