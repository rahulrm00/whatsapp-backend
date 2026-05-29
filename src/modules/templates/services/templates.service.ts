import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Template, TemplateDocument } from '../schemas/template.schema';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { MetaTemplateService } from './meta-template.service';
import { TemplateSyncService } from './template-sync.service';
import { TemplateValidatorService } from './template-validation.service';
import { TemplateResponseDto } from '../dto/template-response.dto';
import { SuccessResponseDto } from '../dto/success-response.dto';
import { TemplateStatus } from '@common/enum/template-status.enum';
import { TemplateParameterFormat } from '@common/enum/template-parameterformat.enum';
import { TemplateCategory } from '@common/enum/template-category.enum';
import { GetAllTemplatesDto } from '../dto/get-all-templates.dto';
import { GetAllTemplatesResponseDto } from '../dto/get-all-template-response.dto';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);
  constructor(
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
    private readonly templateValidatorService: TemplateValidatorService,
    private readonly templateSyncService: TemplateSyncService,
    private readonly metaTemplateService: MetaTemplateService,
  ) {}

  async createTemplate(
    data: CreateTemplateDto,
  ): Promise<SuccessResponseDto<TemplateResponseDto>> {
    this.logger.log(
      `Creating template with name: ${data.name} for tenant: ${data.tenantId}`,
    );
    this.templateValidatorService.validate(data);
    const existingTemplate = await this.templateModel.findOne({
      tenantId: data.tenantId,
      name: data.name,
      category: data.category,
      language: data.language,
      isDeleted: false,
    });
    if (existingTemplate) {
      throw new BadRequestException('Template already exists');
    }

    const metaResponse = await this.metaTemplateService.createTemplate(data);
    try {
      const template = await this.templateModel.create({
        tenantId: data.tenantId,

        metaTemplateId: metaResponse.data.id,

        name: data.name,

        category: data.category,

        language: data.language,

        parameterFormat: data.parameterFormat,

        components: data.components,

        variables: data.variables || [],

        status: metaResponse.data.status,

        syncedAt: new Date(),

        createdBy: data.createdBy || '',
      });

      return {
        success: true,

        message: 'Template created successfully',

        data: {
          id: template._id.toString(),
          tenantId: template.tenantId,
          metaTemplateId: template.metaTemplateId,

          name: template.name,

          category: template.category as TemplateCategory,

          language: template.language,

          parameterFormat: template.parameterFormat as TemplateParameterFormat,

          status: template.status as TemplateStatus,

          components: template.components,
          variables: template.variables,
          createdBy: template.createdBy,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        },
      };
    } catch (error: any) {
      try {
        await this.metaTemplateService.deleteTemplate(metaResponse.data.id);
      } catch (rollbackError) {
        console.error('Meta rollback failed', rollbackError);
      }

      throw new InternalServerErrorException('Failed to save template');
    }
  }

  async getTemplateById(id: string): Promise<SuccessResponseDto<TemplateResponseDto>> {
    if (!id) {
      throw new BadRequestException('Template ID is required');
    }
    try{
       const template = await this.templateModel.findOne({
        _id: id,
        isDeleted: false,
      }).lean();
      if (!template) {
        throw new BadRequestException('Template not found');
      }
      return {
        success: true,
        message: 'Template fetched successfully',
        data: {
          id: template._id.toString(),
          tenantId: template.tenantId,
          metaTemplateId: template.metaTemplateId,

          name: template.name,

          category: template.category as TemplateCategory,

          language: template.language,

          parameterFormat: template.parameterFormat as TemplateParameterFormat,

          status: template.status as TemplateStatus,

          components: template.components,
          variables: template.variables,
          createdBy: template.createdBy,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        },
      }
    } catch (error: any) {
       throw new InternalServerErrorException('Failed to fetch template');
    }
  }

  async templateIdExists(id: string): Promise<boolean> {
    try{
        const template = await this.templateModel.exists({
        _id: id,
        status: TemplateStatus.PENDING,
        isDeleted: false,
      });
      return !!template;
    }catch(error:any){
      throw new InternalServerErrorException('Failed to check template existence');
    }
  }

  async getAllTemplates(
    query: GetAllTemplatesDto,
  ): Promise<GetAllTemplatesResponseDto> {
    const { page = 1, limit = 10, search, tenantId, category, status } = query;

    const filter: any = {
      isDeleted: false,
    };

    if (tenantId) {
      filter.tenantId = tenantId;
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.name = {
        $regex: search,
        $options: 'i',
      };
    }

    const skip = (page - 1) * limit;

    const [templates, total] = await Promise.all([
      this.templateModel
        .find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      this.templateModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,

      message: 'Templates fetched successfully',

      pagination: {
        total,

        page,

        limit,

        totalPages,

        hasNextPage: page < totalPages,

        hasPreviousPage: page > 1,
      },

      data: templates.map((template) => ({
        id: template._id.toString(),

        tenantId: template.tenantId,

        metaTemplateId: template.metaTemplateId,

        name: template.name,

        category: template.category as TemplateCategory,

        language: template.language,

        parameterFormat: template.parameterFormat as TemplateParameterFormat,

        status: template.status as TemplateStatus,

        components: template.components,

        variables: template.variables,

        createdBy: template.createdBy,

        createdAt: template.createdAt,

        updatedAt: template.updatedAt,
      })),
    };
  }
}
