import { IsString, IsBoolean, IsOptional, IsDate, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MetadataDto {
  @IsString()
  country!: string;

  @IsString()
  appVersion!: string;
}

export class CreateActiveSessionDto {
  @IsString()
  userId!: string;

  @IsString()
  deviceId!: string;

  @IsString()
  accessTokenJti!: string;

  @IsString()
  refreshTokenJti!: string;

  @IsDate()
  @Type(() => Date)
  loginAt!: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastAccessedAt?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  logoutAt?: Date | null;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsBoolean()
  isRevoked?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  revokedAt?: Date | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => MetadataDto)
  metadata?: MetadataDto;
}
