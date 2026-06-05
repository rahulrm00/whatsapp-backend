import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadMediaDto } from '../dto/UploadMediaDto.dto';
import { Express } from 'express';
import 'multer';
import { CampaignMediaService } from '../services/campaign-media.service';

@Controller('campaignmedia')
export class CampaignMediaController {
  constructor(private readonly campaignMediaService: CampaignMediaService) {}

  @Post('/v1/:id/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @Param('id') campaignRunId: string,
    @UploadedFile()
    file: Express.Multer.File,

    @Body()
    dto: UploadMediaDto,
  ) {
    return this.campaignMediaService.uploadMedia(campaignRunId, file, dto);
  }

  @Delete('v1/:campaignRunId/:mediaId')
  async deleteMedia(
    @Param('campaignRunId') campaignRunId: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.campaignMediaService.deleteMedia(campaignRunId, mediaId);
  } 
}
