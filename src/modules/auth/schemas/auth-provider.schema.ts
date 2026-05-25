import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  Document,
  Types,
} from 'mongoose';

import { UserRole }
from '../../../common/enum/user-role.enum';

export type AuthProviderDocument =
  AuthProvider & Document;

@Schema({
  collection: 'authprovider',
  timestamps: true,
})
export class AuthProvider {

  @Prop({
    type: Types.ObjectId,
    required: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: Number,
    default: 1,
  })
  version!: number;

  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 50,
  })
  username!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 100,
  })
  email!: string;

  @Prop({
    type: String,
    required: true,
    minlength: 8,
    maxlength: 200,
    select: false,
  })
  password!: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(UserRole),
    default: UserRole.ADMIN,
  })
  role!: UserRole;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive!: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  isDeleted!: boolean;

  @Prop({
    type: Date,
  })
  deletedAt?: Date;

  @Prop({
    type: Date,
  })
  restoredAt?: Date;

  @Prop({
    type: Date,
  })
  lastLoginAt?: Date;

  @Prop({
    type: Number,
    default: 0,
  })
  failedLoginAttempts!: number;

  @Prop({
    type: Date,
  })
  lockedUntil?: Date;

}

export const AuthProviderSchema =
  SchemaFactory.createForClass(
    AuthProvider,
  );

/**
 * ----------------------------------------
 * UNIQUE INDEXES
 * ----------------------------------------
 */

AuthProviderSchema.index(
  {
    username: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  },
);

AuthProviderSchema.index(
  {
    email: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  },
);

/**
 * ----------------------------------------
 * QUERY OPTIMIZATION INDEXES
 * ----------------------------------------
 */

AuthProviderSchema.index({
  userId: 1,
});

AuthProviderSchema.index({
  email: 1,
  isActive: 1,
  isDeleted: 1,
});

AuthProviderSchema.index({
  username: 1,
  isActive: 1,
  isDeleted: 1,
});