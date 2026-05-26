import { CampaignRunType } from '@common/enum/campaign-runtype.enum';
import { CampaignContactStatus } from '@common/enum/campaigncontact-status.enum';
import { CampaignRunStatus } from '@common/enum/campaignrun-status.enum';
import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  Document,
  HydratedDocument,
  Types,
} from 'mongoose';

export type CampaignRunDocument =
  HydratedDocument<CampaignRun> &
    Document;

@Schema({
  collection: 'campaignrun',
  timestamps: true,
})
export class CampaignRun {
  @Prop({
    type: Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true,
  })
  campaignId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Template',
    required: true,
    index: true,
  })
  templateId!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    enum: Object.values(CampaignRunType),
    default: CampaignRunType.INSTANT,
  })
  runType!: string;

   @Prop({
      required: true,
      trim: true,
      enum:Object.values(CampaignRunStatus),
      default: CampaignRunStatus.DRAFT,
      index: true,
    })
    status!: string;

  @Prop({
    type: Date,
    default: null,
    validate: {
      validator: (v: Date) =>
        !v || (v instanceof Date && !isNaN(v.getTime())),
      message: 'Invalid scheduledAt date',
    },
  })
  scheduledAt?: Date | null;

  @Prop({
    type: Date,
    default: null,
    validate: {
      validator: (v: Date) =>
        !v || (v instanceof Date && !isNaN(v.getTime())),
      message: 'Invalid startedAt date',
    },
  })
  startedAt?: Date | null;

  @Prop({
    type: Date,
    default: null,
    validate: {
      validator: (v: Date) =>
        !v || (v instanceof Date && !isNaN(v.getTime())),
      message: 'Invalid completedAt date',
    },
  })
  completedAt?: Date | null;

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Total contacts cannot be negative'],
  })
  totalContacts!: number;

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Pending count cannot be negative'],
  })
  pendingCount!: number;

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Queued count cannot be negative'],
  })
  queuedCount!: number;

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Sent count cannot be negative'],
  })
  sentCount!: number;

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Delivered count cannot be negative'],
  })
  deliveredCount!: number;

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Read count cannot be negative'],
  })
  readCount!: number;

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Failed count cannot be negative'],
  })
  failedCount!: number;

  @Prop({
    trim: true,
    maxlength: [500, 'Failure reason too long'],
    default: '',
  })
  failureReason?: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  isDeleted!: boolean;

  @Prop({
    type: Date,
    default: null,
    validate: {
      validator: (v: Date) =>
        !v || (v instanceof Date && !isNaN(v.getTime())),
      message: 'Invalid deletedAt date',
    },
  })
  deletedAt?: Date | null;

  @Prop({
    type: Date,
    default: Date.now,
  })
  createdAt!: Date;

  @Prop({
    type: Date,
    default: Date.now,
  })
  updatedAt!: Date;
}

export const CampaignRunSchema =
  SchemaFactory.createForClass(
    CampaignRun,
  );

CampaignRunSchema.index({
  campaignId: 1,
  status: 1,
});

CampaignRunSchema.index({
  scheduledAt: 1,
  status: 1,
});