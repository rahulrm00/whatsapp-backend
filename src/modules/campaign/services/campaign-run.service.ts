import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CampaignRun,
  CampaignRunDocument,
} from '../schemas/campaign-run.schema';
import { CreateCampaignRunDto } from '../dto/CreateCampaignRun.dto';
import { CampaignRunResponseDto } from '../dto/CampaignRunResponse.dto';
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';
import { TemplatesService } from '@modules/templates/services/templates.service';
import { CampaignRunMapper } from '../mapper/campaign-run.mapper';
import { CreateCampaignRunResponseDto } from '../dto/CreateCampaignRunResponseDto.dto';
import { UpdateCampaignRunDto } from '../dto/UpdateCampaignRun.dto';
import { CampaignRunType } from '@common/enum/campaign-runtype.enum';
import { CampaignRunStatus } from '@common/enum/campaignrun-status.enum';
import { GetAllCampaignRunDto } from '../dto/GetAllCampaignRunDto.dto';
import { GetAllCampaignRunResponseDto } from '../dto/GetAllCampaignRunResponseDto.dto';

@Injectable()
export class CampaignRunService {
  private readonly logger = new Logger(CampaignRunService.name);

  constructor(
    @InjectModel(CampaignRun.name)
    private readonly campaignRunModel: Model<CampaignRunDocument>,
    @InjectModel(Campaign.name)
    private readonly campaignModel: Model<CampaignDocument>,
    private readonly templatesService: TemplatesService,
  ) {}

  async createCampaignRun(
    data: CreateCampaignRunDto,
  ): Promise<CreateCampaignRunResponseDto> {
    if (!data.campaignId || !data.templateId) {
      throw new Error('CampaignId and TemplateId are required');
    }
    try {
      const campaignexists = await this.campaignModel.exists({
        _id: data.campaignId,
        isDeleted: false,
      });
      if (!campaignexists) {
        throw new Error('Campaign not found');
      }
      const templateexists = await this.templatesService.templateIdExists(
        data.templateId,
      );
      if (!templateexists) {
        throw new Error('Template not found');
      }
      const campaignRun = new this.campaignRunModel({
        campaignId: data.campaignId,
        templateId: data.templateId,
        runType: data.runType,
      });
      await campaignRun.save();
      return {
        success: true,
        message: 'Campaign run created successfully',
        data: CampaignRunMapper.toResponse(campaignRun),
      };
    } catch (error: any) {
      console.error(error);

      throw new InternalServerErrorException(error.message);
    }
  }

  async launchCampaignRun(
    id: string,
    data: UpdateCampaignRunDto,
  ): Promise<CreateCampaignRunResponseDto> {
    if (data.runType === CampaignRunType.SCHEDULED && !data.scheduledAt) {
      throw new BadRequestException(
        'scheduledAt is required for scheduled campaigns',
      );
    }
    if (!id || !data.runType) {
      throw new BadRequestException('Invalid campaign run ID or run type');
    }
    try {
      const campaignrunexists = await this.campaignRunModel.exists({
        _id: id,
        isDeleted: false,
      });
      if (!campaignrunexists) {
        throw new BadRequestException('Campaign run not found');
      }
      const campaignStatus =
        data.runType === CampaignRunType.SCHEDULED
          ? CampaignRunStatus.SCHEDULED
          : CampaignRunStatus.QUEUED;
      const updatedRun = await this.campaignRunModel.findByIdAndUpdate(
        id,
        {
          runType: data.runType,
          scheduledAt: data.scheduledAt,
          status: campaignStatus,
        },
        { new: true },
      );
      if (!updatedRun) {
        throw new InternalServerErrorException('Failed to update campaign run');
      }

      return {
        success: true,
        message: 'Campaign run launched successfully',
        data: CampaignRunMapper.toResponse(updatedRun),
      };
    } catch (error: any) {
      console.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllCampaignRuns(
    query: GetAllCampaignRunDto,
  ): Promise<GetAllCampaignRunResponseDto> {
    const { page = 1, limit = 10, search, status } = query;

    try {
      const skip = (page - 1) * limit;

      const filter: any = {
        isDeleted: false,
      };

      if (status) {
        filter.status = status;
      }

      if (search) {
        filter.$or = [
          {
            failureReason: {
              $regex: search,
              $options: 'i',
            },
          },
        ];
      }

      const [campaignRuns, total] = await Promise.all([
        this.campaignRunModel
          .find(filter)
          .populate('campaignId')
          .populate('templateId')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        this.campaignRunModel.countDocuments(filter),
      ]);

      const data = campaignRuns.map((run: any) => ({
        id: run._id.toString(),

        campaignId: run.campaignId?._id?.toString() ?? null,

        templateId: run.templateId?._id?.toString() ?? null,

        runType: run.runType,

        status: run.status,

        scheduledAt: run.scheduledAt,

        startedAt: run.startedAt,

        completedAt: run.completedAt,

        totalContacts: run.totalContacts,

        pendingCount: run.pendingCount,

        queuedCount: run.queuedCount,

        sentCount: run.sentCount,

        deliveredCount: run.deliveredCount,

        readCount: run.readCount,

        failedCount: run.failedCount,

        failureReason: run.failureReason,

        createdAt: run.createdAt,

        updatedAt: run.updatedAt,
      }));

      return {
        success: true,
        message: 'Campaign runs retrieved successfully',
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        data,
      };
    } catch (error: any) {
      console.error(error);

      throw new InternalServerErrorException(error.message);
    }
  }
}
