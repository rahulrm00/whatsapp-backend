import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CampaignContactService } from '../services/campaign-contact.service';
import { CampaignSchedulerService } from '../services/campaign-scheduler.service';
import { CampaignService } from '../services/campaign.service';
import { CreateCampaignDto } from '../dto/CreateCampaignDto.dto';
import { GetAllCampaignDto } from '../dto/GetAllCampaign.Dto.dto';
import { GetCampaignByIdDto } from '../dto/GetCampaignByIdDto.dto';
import { GetAllCampaignResponseDto } from '../dto/GetAllCampaignResponseDto.dto';
import { GetCampaignByIdResponseDto } from '../dto/GetCampaignByIdResponseDto.dto';
import { CreateCampaignRunDto } from '../dto/CreateCampaignRun.dto';
import { CampaignRunResponseDto } from '../dto/CampaignRunResponse.dto';
import { CampaignRunService } from '../services/campaign-run.service';
import { CreateCampaignRunResponseDto } from '../dto/CreateCampaignRunResponseDto.dto';
import { JwtAuthGuard } from '@common/guards/jwt.guard';

@Controller('campaign')
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
  ) {}
  
  @UseGuards(JwtAuthGuard)
  @Post('/v1/create')
  async createCampaign(@Body() body: CreateCampaignDto): Promise<any> {
    return await this.campaignService.createCampaign(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/v1/getall')
  async getAllCampaigns(
    @Query() query: GetAllCampaignDto,
  ): Promise<GetAllCampaignResponseDto> {
    return await this.campaignService.getAllCampaigns(query);
  }
  @UseGuards(JwtAuthGuard)
  @Get('/v1/:id')
  async getCampaignById(
    @Param() params: GetCampaignByIdDto,
  ): Promise<GetCampaignByIdResponseDto> {
    return await this.campaignService.getCampaignById(params);
  }
}
