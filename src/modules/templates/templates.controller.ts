import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MetaTemplateService } from './services/meta-template.service';
import { TemplateSyncService } from './services/template-sync.service';
import { TemplateValidatorService } from './services/template-validation.service';
import { TemplatesService } from './services/templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { TemplateResponseDto } from './dto/template-response.dto';
import { SuccessResponseDto } from './dto/success-response.dto';
import { GetAllTemplatesDto } from './dto/get-all-templates.dto';
import { GetAllTemplatesResponseDto } from './dto/get-all-template-response.dto';

@Controller('templates')
export class TemplatesController {
    constructor(
        private readonly templatesService: TemplatesService,
        private readonly templateValidatorService: TemplateValidatorService,
        private readonly templateSyncService: TemplateSyncService,
        private readonly metaTemplateService: MetaTemplateService,
    ) {}

    @Post('/v1/create')
    async createTemplate(@Body() body: CreateTemplateDto): Promise<SuccessResponseDto<TemplateResponseDto>> {
         return await this.templatesService.createTemplate(body);
    }
    
    @Get('/v1/getall')
    async getAllTemplates(@Param() query: GetAllTemplatesDto): Promise<GetAllTemplatesResponseDto> {
        return await this.templatesService.getAllTemplates(query);
    }
}
