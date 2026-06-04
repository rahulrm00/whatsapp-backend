import { TemplateCategory } from '@common/enum/template-category.enum';
import { TemplateParameterFormat } from '@common/enum/template-parameterformat.enum';
import { TemplateQualityScore } from '@common/enum/template-qualityscore.enum';
import { TemplateStatus } from '@common/enum/template-status.enum';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument, Types } from 'mongoose';

export type TemplateDocument = HydratedDocument<Template>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Template {
  @Prop({
    type: String,
    required: true,
    trim: true,
    index: true,
  })
  tenantId!: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  })
  metaTemplateId!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 512,
    match: /^[a-z0-9_]+$/,
    index: true,
  })
  name!: string;

  @Prop({
    type: String,
    required: true,
    uppercase: true,
    enum: Object.values(TemplateCategory),
    index: true,
  })
  category!: string;

  @Prop({
  type: Types.ObjectId,
  ref: 'TemplateMedia',
  default: null,
})
mediaId?: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
    default: 'en_US',
    index: true,
  })
  language!: string;

  @Prop({
    type: String,
    required: true,
    uppercase: true,
    enum: Object.values(TemplateParameterFormat),
    default: TemplateParameterFormat.POSITIONAL,
  })
  parameterFormat!: string;

  @Prop({
    type: String,
    required: true,
    uppercase: true,
    enum: Object.values(TemplateStatus),
    default: TemplateStatus.PENDING,
    index: true,
  })
  status!: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
    enum: Object.values(TemplateQualityScore),
  })
  qualityScore!: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
    maxlength: 1000,
  })
  rejectionReason!: string;

  @Prop({
    type: Array,
    default: [],
  })
  components!: any[];

  @Prop({
    type: [String],
    default: [],
  })
  variables!: string[];

  @Prop({
    type: Boolean,
    default: false,
    index: true,
  })
  isDeleted!: boolean;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive!: boolean;

  @Prop({
    type: Number,
    default: 1,
    min: 1,
  })
  version!: number;

  @Prop({
    type: Date,
    default: Date.now,
  })
  syncedAt!: Date;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  createdBy!: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  updatedBy!: string;

  // timestamps
  createdAt!: Date;
  updatedAt!: Date;
}

export const TemplateSchema =
  SchemaFactory.createForClass(Template);