import {
  IsOptional,
  IsString,
  IsNotEmpty,
} from 'class-validator';

export class GetTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}