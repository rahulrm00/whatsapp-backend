import { IsOptional, IsString } from 'class-validator';

export class SignTokensResponseDto {
  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsString()
  kid?: string;

  @IsOptional()
  @IsString()
  accessJti?: string;

  @IsOptional()
  @IsString()
  refreshJti?: string;

  @IsOptional()
  accessExp?: number | string;

  @IsOptional()
  refreshExp?: number | string;
}