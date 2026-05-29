import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { MetaTemplateBuilder } from './builders/MetaTemplateBuilder.builder';

@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService, MetaTemplateBuilder],
  exports: [WhatsappService, MetaTemplateBuilder],
})
export class WhatsappModule {}
