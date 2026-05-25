import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './services/templates.service';
import { TemplateSyncService } from './services/template-sync.service';
import { MetaTemplateService } from './services/meta-template.service';
import { TemplateValidatorService } from './services/template-validation.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Template, TemplateSchema } from './schemas/template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Template.name, schema: TemplateSchema }]),
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService,TemplateValidatorService,TemplateSyncService,MetaTemplateService],
})
export class TemplatesModule {}
