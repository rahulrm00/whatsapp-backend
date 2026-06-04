import { Module } from '@nestjs/common';
import { TemplatesController } from './controller/templates.controller';
import { TemplatesService } from './services/templates.service';
import { TemplateSyncService } from './services/template-sync.service';
import { MetaTemplateService } from './services/meta-template.service';
import { TemplateValidatorService } from './services/template-validation.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Template, TemplateSchema } from './schemas/template.schema';
import { TemplateMediaController } from './controller/template-media.controller';
import { TemplateMedia, TemplateMediaSchema } from './schemas/templatemedia.schema';
import { TemplateMediaService } from './services/template-media.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Template.name, schema: TemplateSchema },
      { name: TemplateMedia.name, schema: TemplateMediaSchema }
    ]),
  ],
  controllers: [TemplatesController,TemplateMediaController],
  providers: [TemplatesService,TemplateValidatorService,TemplateSyncService,MetaTemplateService,TemplateMediaService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
