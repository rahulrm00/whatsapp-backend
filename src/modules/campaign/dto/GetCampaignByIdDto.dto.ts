import {
  IsMongoId,
  IsNotEmpty,
} from 'class-validator';

export class GetCampaignByIdDto {
  @IsNotEmpty()
  @IsMongoId()
  id!: string;
}