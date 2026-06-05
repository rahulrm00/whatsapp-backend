import { Controller, Delete, Param, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { TemplateMediaService } from "../services/template-media.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "@common/guards/jwt.guard";

@Controller('templatemedia')
export class TemplateMediaController{
   constructor(
    private readonly templateMediaService: TemplateMediaService
   ) {}
    
   @UseGuards(JwtAuthGuard)
    @Post('/v1/upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadMedia(@UploadedFile() file: Express.Multer.File) {
        return this.templateMediaService.uploadMedia(file);
    }
    
    @UseGuards(JwtAuthGuard)
    @Delete('v1/:id')
    async deleteMedia(@Param('id') id :string){
        return this.templateMediaService.deleteMedia(id);
    }
} 