import { CampaignContactStatus } from '@common/enum/campaigncontact-status.enum';
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

export type CampaignContactDocument =
  HydratedDocument<CampaignContact> &
    Document;

@Schema({
  collection: 'campaigncontact',
  timestamps: true,
})
export class CampaignContact {
  @Prop({
    type: Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true,
  })
  campaignId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'CampaignRun',
    required: true,
    index: true,
  })
  campaignRunId!: Types.ObjectId;

  // // Optional for future CRM/contact module
  // @Prop({
  //   type: Types.ObjectId,
  //   ref: 'Contact',
  //   default: null,
  //   index: true,
  // })
  // contactId?: Types.ObjectId | null;

  // Snapshot Data
  @Prop({
    lowercase: true,
    trim: true,
    default: '',
    maxlength: [100, 'Name too long'],
  })
  name?: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: [20, 'Phone number too long'],
    index: true,
  })
  phone!: string;

  @Prop({
    trim: true,
    lowercase: true,
    maxlength: [150, 'Email too long'],
    default: '',
  })
  email?: string;

  @Prop({
    type: Object,
    default: {},
  })
  customFields?: Record<string, any>;

  @Prop({
    required: true,
    trim: true,
    enum:Object.values(CampaignContactStatus),
    default: CampaignContactStatus.PENDING,
    index: true,
  })
  status!: string;

  @Prop({
    trim: true,
    maxlength: [200, 'WAMID too long'],
    default: '',
  })
  wamid?: string;

  @Prop({
    type: Date,
    default: null,
    validate: {
      validator: (v: Date) =>
        !v || (v instanceof Date && !isNaN(v.getTime())),
      message: 'Invalid queuedAt date',
    },
  })
  queuedAt?: Date | null;

  @Prop({
    type: Date,
    default: null,
    validate: {
      validator: (v: Date) =>
        !v || (v instanceof Date && !isNaN(v.getTime())),
      message: 'Invalid processingAt date',
    },
  })
  processingAt?: Date | null;

  @Prop({
    type: Date,
    default: null,
    validate: {
      validator: (v: Date) =>
        !v || (v instanceof Date && !isNaN(v.getTime())),
      message: 'Invalid sentAt date',
    },
  })
  sentAt?: Date | null;

  @Prop({
    type: Date,
    default: null,
    validate: {
      validator: (v: Date) =>
        !v || (v instanceof Date && !isNaN(v.getTime())),
      message: 'Invalid deliveredAt date',
    },
  })
  deliveredAt?: Date | null;

  @Prop({
    type: Date,
    default: null,
    validate: {
      validator: (v: Date) =>
        !v || (v instanceof Date && !isNaN(v.getTime())),
      message: 'Invalid readAt date',
    },
  })
  readAt?: Date | null;

  @Prop({
    type: Date,
    default: null,
    validate: {
      validator: (v: Date) =>
        !v || (v instanceof Date && !isNaN(v.getTime())),
      message: 'Invalid failedAt date',
    },
  })
  failedAt?: Date | null;

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
  isRetried!: boolean;

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Retry count cannot be negative'],
  })
  retryCount!: number;

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
}

export const CampaignContactSchema =
  SchemaFactory.createForClass(
    CampaignContact,
  );

// Fast worker fetching
CampaignContactSchema.index({
  campaignRunId: 1,
  status: 1,
});

// Avoid duplicate phone in same run
CampaignContactSchema.index(
  {
    campaignRunId: 1,
    phone: 1,
  },
  { unique: true },
);

// Analytics optimization
CampaignContactSchema.index({
  campaignId: 1,
  status: 1,
});
CampaignContactSchema.index({
  wamid: 1,
});