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
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';
import { TemplatesService } from '@modules/templates/services/templates.service';
import { CampaignRunMapper } from '../mapper/campaign-run.mapper';
import { CreateCampaignRunResponseDto } from '../dto/CreateCampaignRunResponseDto.dto';
import { UpdateCampaignRunDto } from '../dto/UpdateCampaignRun.dto';
import { CampaignRunType } from '@common/enum/campaign-runtype.enum';
import { CampaignRunStatus } from '@common/enum/campaignrun-status.enum';
import { GetAllCampaignRunDto } from '../dto/GetAllCampaignRunDto.dto';
import { GetAllCampaignRunResponseDto } from '../dto/GetAllCampaignRunResponseDto.dto';
import {
  CampaignContact,
  CampaignContactDocument,
} from '../schemas/campaign-contact.schema';
import { CampaignQueueService } from '@modules/queue/services/campaign-queue.service';
import { CampaignContactStatus } from '@common/enum/campaigncontact-status.enum';

@Injectable()
export class CampaignRunService {
  private readonly logger = new Logger(CampaignRunService.name);

  constructor(
    @InjectModel(CampaignRun.name)
    private readonly campaignRunModel: Model<CampaignRunDocument>,
    @InjectModel(Campaign.name)
    private readonly campaignModel: Model<CampaignDocument>,
    private readonly templatesService: TemplatesService,
    private readonly campaignQueueService: CampaignQueueService,
    @InjectModel(CampaignContact.name)
    private readonly campaignContactModel: Model<CampaignContactDocument>,
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
    // validate input
    if (!id || !data.runType) {
      throw new BadRequestException('Invalid campaign run ID or run type');
    }

    // validate scheduled campaign
    if (data.runType === CampaignRunType.SCHEDULED && !data.scheduledAt) {
      throw new BadRequestException(
        'scheduledAt is required for scheduled campaigns',
      );
    }

    try {
      // validate campaign run
      const campaignRun = await this.campaignRunModel.findOne({
        _id: id,

        isDeleted: false,
      });

      if (!campaignRun) {
        throw new BadRequestException('Campaign run not found');
      }

      // allow only draft launch
      if (campaignRun.status !== CampaignRunStatus.DRAFT) {
        throw new BadRequestException('Campaign already launched');
      }

      // validate contacts
      const totalContacts = await this.campaignContactModel.countDocuments({
        campaignRunId: id,

        isDeleted: false,

        status: CampaignContactStatus.PENDING,
      });

      if (!totalContacts) {
        throw new BadRequestException('No contacts found');
      }

      // determine status
      const campaignStatus =
        data.runType === CampaignRunType.SCHEDULED
          ? CampaignRunStatus.SCHEDULED
          : CampaignRunStatus.QUEUED;

      // update campaign run
      const updatedRun = await this.campaignRunModel.findByIdAndUpdate(
        id,

        {
          runType: data.runType,

          scheduledAt: data.scheduledAt || null,

          status: campaignStatus,
        },

        {
          new: true,
        },
      );

      if (!updatedRun) {
        throw new InternalServerErrorException('Failed to update campaign run');
      }

      // SEND NOW
      if (data.runType === CampaignRunType.INSTANT) {
        await this.campaignQueueService.addCampaignJob(id);

        console.log('INSTANT JOB ADDED');
      }

      // SCHEDULE LATER
      if (data.runType === CampaignRunType.SCHEDULED) {
        // validate future time
        if (new Date(data.scheduledAt!).getTime() <= Date.now()) {
          throw new BadRequestException('Scheduled time must be future');
        }

        const delay = new Date(data.scheduledAt!).getTime() - Date.now();

        await this.campaignQueueService.addCampaignJob(id, delay);

        console.log('SCHEDULED JOB ADDED');
      }

      return {
        success: true,

        message:
          data.runType === CampaignRunType.SCHEDULED
            ? 'Campaign scheduled successfully'
            : 'Campaign queued successfully',

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
          .populate({
            path: 'campaignId',
            select: 'title',
          })
          .populate({
            path: 'templateId',
            select: 'name',
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        this.campaignRunModel.countDocuments(filter),
      ]);

      const data = campaignRuns.map((run: any) => ({
        id: run._id.toString(),

        campaignId: run.campaignId?._id?.toString() ?? null,

        campaignName: run.campaignId?.title ?? null,

        templateId: run.templateId?._id?.toString() ?? null,

        templateName: run.templateId?.name ?? null,

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
