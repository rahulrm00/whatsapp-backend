import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
} from 'class-validator';

export class SignTokensRequestDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  issuer?: string;

  @IsOptional()
  @IsString()
  audience?: string;

  @IsOptional()
  @IsObject()
  claims?: { [key: string]: string };

  @IsOptional()
  @IsNumber()
  accessTtlSec?: number;

  @IsOptional()
  @IsNumber()
  refreshTtlSec?: number;

  @IsOptional()
  @IsString()
  deviceId?: string;
}