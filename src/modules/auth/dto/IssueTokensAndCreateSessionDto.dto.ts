import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class IssueTokensAndCreateSessionDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;
}