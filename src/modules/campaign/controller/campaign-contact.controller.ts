import { Body, Controller, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { CampaignContactService } from "../services/campaign-contact.service";
import { FileInterceptor }from '@nestjs/platform-express';

@Controller('campaigncontact')
export class CampaignContactController {
   constructor(
    private readonly campaignContactService: CampaignContactService
   ) {}

   @Post("/v1/:id/upload")
   @UseInterceptors(FileInterceptor('file'))
   async uploadContacts(@Param('id') campaignRunId: string, @UploadedFile() file : any) {
      return this.campaignContactService.uploadContacts(campaignRunId, file);
   }

}