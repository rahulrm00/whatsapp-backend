import { CampaignResponseDto } from "./CampaignResponseDto.dto";
import { PaginationDto } from "./PaginationDto.dto";

export class GetAllCampaignResponseDto {
  success!: boolean;

  message!: string;

  pagination!: PaginationDto;

  data!: CampaignResponseDto[];
}