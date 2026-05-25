import { CampaignResponseDto } from "./CampaignResponseDto.dto";

export class GetCampaignByIdResponseDto {
  success!: boolean;

  message!: string;

  data!: CampaignResponseDto;
}