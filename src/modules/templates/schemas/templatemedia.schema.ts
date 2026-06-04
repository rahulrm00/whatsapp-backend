import { MediaType } from '@common/enum/meta-media.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document, HydratedDocument } from 'mongoose';

export type TemplateMediaDocument = HydratedDocument<TemplateMedia> & Document;

@Schema({
  collection: 'templatemetamedia',
  timestamps: true,
})
export class TemplateMedia {

  @Prop({
    required: true,
  })
  fileName!: string;

  @Prop({
    required: true,
  })
  mimeType!: string;

  @Prop({
    required: true,
    enum: Object.values(MediaType),
  })
  mediaType!: string;

  @Prop({
    required: true,
  })
  headerHandle!: string;

  @Prop({
    required: true,
  })
  fileSize!: number;
}

export const TemplateMediaSchema = SchemaFactory.createForClass(TemplateMedia);
