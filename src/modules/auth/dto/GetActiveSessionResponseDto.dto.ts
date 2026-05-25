import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class GetActiveSessionResponseDto {

  @IsOptional()
  @IsBoolean()
  isRevoked?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  accessTokenJti?: string;

}