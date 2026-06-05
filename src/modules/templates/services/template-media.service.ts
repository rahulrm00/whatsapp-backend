import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  TemplateMedia,
  TemplateMediaDocument,
} from '../schemas/templatemedia.schema';
import { Connection, Model } from 'mongoose';
import axios from 'axios';
import { MediaType } from '@common/enum/meta-media.enum';

@Injectable()
export class TemplateMediaService {
  private readonly metaApiId: string;
  private readonly accessToken: string;
  private readonly metaApiBaseUrl: string;
  constructor(
    @InjectModel(TemplateMedia.name)
    private readonly templateMediaModel: Model<TemplateMediaDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {
    ((this.metaApiId = process.env.META_APP_ID || ''),
      (this.accessToken = process.env.META_API_TOKEN || ''),
      (this.metaApiBaseUrl = process.env.META_API_BASE_URL || ''));
  }
  async uploadMedia(file: Express.Multer.File)  {
    if (!file) {
      throw new BadRequestException('File required');
    }

    const headerHandle = await this.uploadToMeta(file);

    const media = await this.templateMediaModel.create({
      fileName: file.originalname,

      mimeType: file.mimetype,

      mediaType: this.getMediaType(file.mimetype),

      fileSize: file.size,

      headerHandle,
    });

    return {
  id: media._id,
  fileName: media.fileName,
  mimeType: media.mimeType,
  mediaType: media.mediaType,
  fileSize: media.fileSize,
};
  }
  private async uploadToMeta(file: Express.Multer.File): Promise<string> {
    const session = await axios.post(
      `${this.metaApiBaseUrl}/${this.metaApiId}/uploads`,
      {
        file_name: file.originalname,

        file_length: file.size,

        file_type: file.mimetype,
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    );
    const uploadResponse = await axios.post(
      `${this.metaApiBaseUrl}/${session.data.id}`,
      file.buffer,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,

          offset: '0',

          'Content-Type': 'application/octet-stream',
        },
      },
    );
    return uploadResponse.data.h;
  }
   private getMediaType(mimeType: string): MediaType {
      if (mimeType.startsWith('image/')) {
        return MediaType.IMAGE;
      }
  
      if (mimeType.startsWith('video/')) {
        return MediaType.VIDEO;
      }
  
      return MediaType.DOCUMENT;
    }

    async deleteMedia(id :string):Promise<string>{
      try{
         const templateMedia = await this.templateMediaModel.findById(id);
         if(!templateMedia){
          throw new NotFoundException("Tmeplate Media not found");
         } 
         await this.templateMediaModel.findByIdAndDelete(id);
         return "Template Media Delete Succesfully"
      }catch(error:any){
       throw new InternalServerErrorException("Template Media not deleted");
      }
    }
}
