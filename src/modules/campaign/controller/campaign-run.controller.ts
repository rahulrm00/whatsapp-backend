import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { CampaignRunService } from '../services/campaign-run.service';
import { CreateCampaignRunDto } from '../dto/CreateCampaignRun.dto';
import { CreateCampaignRunResponseDto } from '../dto/CreateCampaignRunResponseDto.dto';
import { UpdateCampaignRunDto } from '../dto/UpdateCampaignRun.dto';
import {CampaignRunOverviewDto} from '../dto/CampaignRunOverviewDto.dto';
import { GetAllCampaignRunDto } from '../dto/GetAllCampaignRunDto.dto';
import { GetAllCampaignRunResponseDto } from '../dto/GetAllCampaignRunResponseDto.dto';
import { JwtAuthGuard } from '@common/guards/jwt.guard';


@Controller('campaignrun')
export class CampaignRunController {
  constructor(private readonly campaignRunService: CampaignRunService) {}
  
  @UseGuards(JwtAuthGuard)
  @Post('/v1/create')
  async createCampaignRun(
    @Body() dto: CreateCampaignRunDto,
  ): Promise<CreateCampaignRunResponseDto> {
    return this.campaignRunService.createCampaignRun(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/v1/:id/launch')
    async launchCampaignRun(@Param('id') id: string ,@Body() dto: UpdateCampaignRunDto,): Promise<CreateCampaignRunResponseDto> {
        return this.campaignRunService.launchCampaignRun(id,dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('/v1/getall')
    async getAllCampaignRuns(
      @Query() dto: GetAllCampaignRunDto,
    ): Promise<GetAllCampaignRunResponseDto> {
      return this.campaignRunService.getAllCampaignRuns(dto);
    }
   
    @UseGuards(JwtAuthGuard)
    @Get('/v1/overallstats')
    async getOverallStats():Promise<CampaignRunOverviewDto> {
      return this.campaignRunService.getOverview();
    }
}
