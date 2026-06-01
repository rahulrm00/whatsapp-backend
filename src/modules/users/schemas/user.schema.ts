import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import { Document } from 'mongoose';

export type UserDocument =
  User & Document;

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {

  @Prop({
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  })
  userId!: string;
  
  @Prop({
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    })
    email!: string;

  @Prop({
    type: Number,
    default: 1,
  })
  version!: number;

  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  name!: string;

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

}

export const UserSchema =
  SchemaFactory.createForClass(
    User,
  );

/**
 * ----------------------------------------
 * UNIQUE INDEXES
 * ----------------------------------------
 */
UserSchema.index(
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

UserSchema.index({
  userId: 1,
  isActive: 1,
  isDeleted: 1,
});