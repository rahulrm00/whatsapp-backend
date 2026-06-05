import { Body, Controller, Delete, Param, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { CampaignContactService } from "../services/campaign-contact.service";
import { FileInterceptor }from '@nestjs/platform-express';
import { UploadCampaignContactsResponseDto } from "../dto/UploadcampaignContactsResponse.dto";
import { JwtAuthGuard } from "@common/guards/jwt.guard";


@Controller('campaigncontact')
export class CampaignContactController {
   constructor(
    private readonly campaignContactService: CampaignContactService
   ) {}
   
   @UseGuards(JwtAuthGuard)
   @Post("/v1/:id/upload")
   @UseInterceptors(FileInterceptor('file'))
   async uploadContacts(@Param('id') campaignRunId: string, @UploadedFile() file : any): Promise<UploadCampaignContactsResponseDto> {
      return this.campaignContactService.uploadContacts(campaignRunId, file);
   }
    
   @UseGuards(JwtAuthGuard)
   @Delete("/v1/:id")
   async deleteContacts(@Param('id') campaignRunId: string): Promise<{message: string}> {
      await this.campaignContactService.deleteContacts(campaignRunId);
      return {message: 'Contacts deleted successfully'};
   }
}