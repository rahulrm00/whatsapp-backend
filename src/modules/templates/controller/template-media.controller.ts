import { Controller, Delete, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { TemplateMediaService } from "../services/template-media.service";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller('templatemedia')
export class TemplateMediaController{
   constructor(
    private readonly templateMediaService: TemplateMediaService
   ) {}

    @Post('/v1/upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadMedia(@UploadedFile() file: Express.Multer.File) {
        return this.templateMediaService.uploadMedia(file);
    }

    @Delete('v1/:id')
    async deleteMedia(@Param('id') id :string){
        return this.templateMediaService.deleteMedia(id);
    }
} 