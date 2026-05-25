import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CampaignContactService } from './services/campaign-contact.service';
import { CampaignSchedulerService } from './services/campaign-scheduler.service';
import { CampaignService } from './services/campaign.service';
import { CreateCampaignDto } from './dto/CreateCampaignDto.dto';
import { GetAllCampaignDto } from './dto/GetAllCampaign.Dto.dto';
import { GetCampaignByIdDto } from './dto/GetCampaignByIdDto.dto';
import { GetAllCampaignResponseDto } from './dto/GetAllCampaignResponseDto.dto';
import { GetCampaignByIdResponseDto } from './dto/GetCampaignByIdResponseDto.dto';

@Controller('campaign')
export class CampaignController {
   constructor(
    private readonly campaignService: CampaignService,
    private readonly campaignContactService: CampaignContactService,
    private readonly campaignSchedulerService: CampaignSchedulerService,
   ) {}

   @Post('/v1/create')
    async createCampaign(@Body() body: CreateCampaignDto): Promise<any> {
       return await this.campaignService.createCampaign(body);
    }

    @Get('/v1/getall')
    async getAllCampaigns(@Query() query: GetAllCampaignDto): Promise<GetAllCampaignResponseDto> {
        return await this.campaignService.getAllCampaigns(query);
    }

    @Get('/v1/:id')
    async getCampaignById(@Param() params: GetCampaignByIdDto,): Promise<GetCampaignByIdResponseDto> {
        return await this.campaignService.getCampaignById(params);
    }
}
