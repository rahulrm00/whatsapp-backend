import { IsNumber, IsString } from 'class-validator';

export class LoginResponseDto {
  @IsString()
  message!: string;

  @IsString()
  accessToken!: string;

  @IsString()
  refreshToken!: string;

  @IsNumber()
  accessExp!: number;

  @IsNumber()
  refreshExp!: number;

  @IsString()
  username!: string;

  @IsString()
  email!: string;
}
