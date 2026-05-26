import { CampaignRunResponseDto } from "./CampaignRunResponse.dto";


export class CreateCampaignRunResponseDto {
    success!: boolean;

    message!: string;

    data!: CampaignRunResponseDto;
}