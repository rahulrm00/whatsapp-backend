import { CampaignRunResponseDto } from "./CampaignRunResponse.dto";
import { PaginationDto } from "./PaginationDto.dto";

export class GetAllCampaignRunResponseDto {
  success!: boolean;

  message!: string;

  pagination!: PaginationDto;

  data!: CampaignRunResponseDto[];
}