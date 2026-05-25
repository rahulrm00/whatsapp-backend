import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { isIP } from 'net';

export type ActiveSessionDocument = ActiveSession & Document;

@Schema({collection:"activesession", timestamps: true })
export class ActiveSession {
  @Prop({
    required: true,
    index: true,
    match: [/^[A-Za-z0-9_-]{3,50}$/, 'Invalid userId format'],
  })
  userId!: string;

  @Prop({
    required: true,
    trim: true,
    minlength: [5, 'Device ID must be at least 5 characters'],
    maxlength: [100, 'Device ID must be at most 100 characters'],
  })
  deviceId!: string;

  @Prop({
    required: true,
    trim: true,
    match: [/^[A-Za-z0-9_-]{10,200}$/, 'Invalid Access Token JTI format'],
  })
  accessTokenJti!: string;

  @Prop({
    required: true,
    trim: true,
    match: [/^[A-Za-z0-9_-]{10,200}$/, 'Invalid Refresh Token JTI format'],
  })
  refreshTokenJti!: string;

  @Prop({
    required: true,
    type: Date,
    validate: {
      validator: (v: Date) => v instanceof Date && !isNaN(v.getTime()),
      message: 'Invalid loginAt date',
    },
  })
  loginAt!: Date;

  @Prop({
    type: Date,
    validate: {
      validator: (v: Date) => !v || (v instanceof Date && !isNaN(v.getTime())),
      message: 'Invalid lastAccessedAt date',
    },
  })
  lastAccessedAt?: Date;

  @Prop({
    type: Date,
    default: null,
    validate: {
      validator: (v: Date) => !v || (v instanceof Date && !isNaN(v.getTime())),
      message: 'Invalid logoutAt date',
    },
  })
  logoutAt?: Date | null;

  @Prop({
  required: true,
  trim: true,
  validate: {
    validator: (v: string) => isIP(v) !== 0,
    message: 'Invalid IP address (IPv4 or IPv6)',
  },
})
ipAddress!: string;


  @Prop({
    type: String,
    trim: true,
    maxlength: [300, 'User agent string too long'],
  })
  userAgent?: string;

  @Prop({ type: Boolean, default: false })
  isRevoked!: boolean;

  @Prop({
    type: Date,
    default: null,
    validate: {
      validator: (v: Date) => !v || (v instanceof Date && !isNaN(v.getTime())),
      message: 'Invalid revokedAt date',
    },
  })
  revokedAt?: Date | null;

  @Prop({
    type: Object,
    default: {
      country: '',
      appVersion: '',
    },
    validate: {
      validator: (v: any) => {
        if (!v) return true;
        if (typeof v.country !== 'string' || typeof v.appVersion !== 'string')
          return false;
        return v.country.length <= 50 && v.appVersion.length <= 30;
      },
      message: 'Invalid metadata format',
    },
  })
  metadata!: {
    country: string;
    appVersion: string;
  };
}

export const ActiveSessionSchema = SchemaFactory.createForClass(ActiveSession);
