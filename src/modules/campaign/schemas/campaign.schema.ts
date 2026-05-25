import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  Document,
  Types,
} from 'mongoose';

import { CampaignStatus } from '@common/enum/campaign-status.enum';
import { Status } from '@common/enum/status.enum';

export type CampaignDocument =
  Campaign & Document;

@Schema({
  collection: 'campaign',
  timestamps: true,
})
export class Campaign {
  @Prop({
    required: true,
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [150, 'Title must be at most 150 characters'],
  })
  title!: string;

  @Prop({
    trim: true,
    maxlength: [500, 'Description too long'],
    default: '',
  })
  description?: string;

  @Prop({
    type: Number,
    enum: Status,
    default: Status.ACTIVE,
    index: true,
  })
  status!: Status;

  @Prop({
    required: true,
    type: String,
    ref: 'Users',
    index: true,
  })
  createdBy!: String;

  @Prop({
    type: Boolean,
    default: false,
    index: true,
  })
  isDeleted!: boolean;

  @Prop({
    type: Date,
    default: null,
  })
  deletedAt?: Date | null;
}

export const CampaignSchema =
  SchemaFactory.createForClass(Campaign);