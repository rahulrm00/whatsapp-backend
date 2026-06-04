import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UploadMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsString()
  uploadedBy! : string;
}