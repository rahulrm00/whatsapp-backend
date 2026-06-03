import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CampaignRunService } from '../services/campaign-run.service';
import { CreateCampaignRunDto } from '../dto/CreateCampaignRun.dto';
import { CreateCampaignRunResponseDto } from '../dto/CreateCampaignRunResponseDto.dto';
import { UpdateCampaignRunDto } from '../dto/UpdateCampaignRun.dto';
import {CampaignRunOverviewDto} from '../dto/CampaignRunOverviewDto.dto';
import { GetAllCampaignRunDto } from '../dto/GetAllCampaignRunDto.dto';
import { GetAllCampaignRunResponseDto } from '../dto/GetAllCampaignRunResponseDto.dto';

@Controller('campaignrun')
export class CampaignRunController {
  constructor(private readonly campaignRunService: CampaignRunService) {}

  @Post('/v1/create')
  async createCampaignRun(
    @Body() dto: CreateCampaignRunDto,
  ): Promise<CreateCampaignRunResponseDto> {
    return this.campaignRunService.createCampaignRun(dto);
  }

  @Patch('/v1/:id/launch')
    async launchCampaignRun(@Param('id') id: string ,@Body() dto: UpdateCampaignRunDto,): Promise<CreateCampaignRunResponseDto> {
        return this.campaignRunService.launchCampaignRun(id,dto);
    }

    @Get('/v1/getall')
    async getAllCampaignRuns(
      @Query() dto: GetAllCampaignRunDto,
    ): Promise<GetAllCampaignRunResponseDto> {
      return this.campaignRunService.getAllCampaignRuns(dto);
    }

    @Get('/v1/overallstats')
    async getOverallStats():Promise<CampaignRunOverviewDto> {
      return this.campaignRunService.getOverview();
    }
}
