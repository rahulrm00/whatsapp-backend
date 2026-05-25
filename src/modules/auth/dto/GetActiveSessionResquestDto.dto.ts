import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class GetActiveSessionRequestDto {

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  userId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceId?: string;

}