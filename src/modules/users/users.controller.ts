import { Body, Controller } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/CreateUserDto.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}
  
  async createUser(@Body() body :CreateUserDto) : Promise<void>{
     await this.usersService.createUser(body);
  }

}
