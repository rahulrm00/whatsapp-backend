import { MediaType } from '@common/enum/meta-media.enum';
import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  Document,
  HydratedDocument,
} from 'mongoose';

export type CampaignMetaMediaDocument =
  HydratedDocument<CampaignMetaMedia> &
    Document;

@Schema({
  collection: 'campaignmetamedia',
  timestamps: true,
})
export class CampaignMetaMedia {
  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  metaMediaId!: string;

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
  fileSize!: number;

  @Prop({
    required: true,
  })
  uploadedBy!: string;
}

export const CampaignMetaMediaSchema =
  SchemaFactory.createForClass(
    CampaignMetaMedia,
  );