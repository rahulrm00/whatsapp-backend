import { MediaType } from '@common/enum/meta-media.enum';
import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { UploadMediaDto } from '../dto/UploadMediaDto.dto';
import { UploadMediaResponseDto } from '../dto/UploadMediaResponseDto.dto';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import {
  CampaignMetaMedia,
  CampaignMetaMediaDocument,
} from '../schemas/campaignmeta-media.schema';
import {
  CampaignRun,
  CampaignRunDocument,
} from '../schemas/campaign-run.schema';
import FormData from 'form-data';

@Injectable()
export class CampaignMediaService {
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly metaApiBaseUrl: string;
  constructor(
    @InjectModel(CampaignRun.name)
    private readonly campaignRunModel: Model<CampaignRunDocument>,
    @InjectModel(CampaignMetaMedia.name)
    private readonly campaignMetaMediaModel: Model<CampaignMetaMediaDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {
    ((this.phoneNumberId = process.env.META_API_PHONE_NUMBER_ID || ''),
      (this.accessToken = process.env.META_API_TOKEN || ''),
      (this.metaApiBaseUrl = process.env.META_API_BASE_URL || ''));
  }

  async uploadMedia(
    campaignRunId: string,
    file: Express.Multer.File,
    dto: UploadMediaDto,
  ): Promise<UploadMediaResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const mediaType = this.getMediaType(file.mimetype);

    const metaMediaId = await this.uploadToMeta(file);

    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const [media] = await this.campaignMetaMediaModel.create(
        [
          {
            metaMediaId,
            fileName: file.originalname,
            mimeType: file.mimetype,
            mediaType,
            fileSize: file.size,
            uploadedBy: dto.uploadedBy,
          },
        ],
        { session },
      );

      const campaignRun = await this.campaignRunModel.findById(campaignRunId).session(session);

      if (!campaignRun) {
        throw new BadRequestException('Campaign run not found');
      }

      await this.campaignRunModel.findByIdAndUpdate(
        campaignRunId,
        {
          mediaId: media._id,
        },
        { session },
      );

      await session.commitTransaction();

      return {
        id: media._id.toString(),
        metaMediaId: media.metaMediaId,
        fileName: media.fileName,
        mimeType: media.mimeType,
        mediaType: media.mediaType,
        fileSize: media.fileSize,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
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

  private async uploadToMeta(file: Express.Multer.File): Promise<string> {
    const form = new FormData();

    form.append('messaging_product', 'whatsapp');

    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const response = await axios.post(
      `${this.metaApiBaseUrl}/${this.phoneNumberId}/media`,
      form,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ...form.getHeaders(),
        },
      },
    );

    return response.data.id;
  }

  async deleteMedia(campaignRunId: string, mediaId: string): Promise<String> {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const campaignRun = await this.campaignRunModel
        .findById(campaignRunId)
        .session(session);
      if (!campaignRun) {
        throw new BadRequestException('Campaign run not found');
      }
      if (campaignRun.mediaId?.toString() !== mediaId) {
        throw new BadRequestException(
          'Media not associated with this campaign run',
        );
      }
      if (campaignRun.mediaId === null) {
        throw new BadRequestException(
          'No media associated with this campaign run',
        );
      }
      await this.campaignRunModel
        .findByIdAndUpdate(campaignRunId, { mediaId: null })
        .session(session);
      const media = await this.campaignMetaMediaModel
        .findById(mediaId)
        .session(session);
      if (!media) {
        throw new BadRequestException('Media not found');
      }
      await this.campaignMetaMediaModel
        .findByIdAndDelete(mediaId)
        .session(session);
      await this.deleteFromMeta(media.metaMediaId);
      await session.commitTransaction();        
      return 'Media deleted successfully';
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private async deleteFromMeta(metaMediaId: string): Promise<void> {
    await axios.delete(
      `${this.metaApiBaseUrl}/${metaMediaId}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    ); 
  }
}
