import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/CreateUserDto.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createUser(body: CreateUserDto): Promise<void> {
    try {
      if (!body.email || !body.name || !body.userId || !body.username) {
        throw new Error('Missing required fields');
      }
      const user = new this.userModel({
        userId: body.userId,
        name: body.name,
        email: body.email,
        username: body.username,
      });
      await user.save();
    } catch (error) {
      throw new Error('Error creating user');
    }
  }
}
