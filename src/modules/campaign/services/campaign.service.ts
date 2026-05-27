import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';
import { CreateCampaignDto } from '../dto/CreateCampaignDto.dto';
import { GetAllCampaignDto } from '../dto/GetAllCampaign.Dto.dto';
import { GetCampaignByIdDto } from '../dto/GetCampaignByIdDto.dto';
import { GetCampaignByIdResponseDto } from '../dto/GetCampaignByIdResponseDto.dto';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);
  constructor(
    @InjectModel(Campaign.name)
    private readonly campaignModel: Model<CampaignDocument>,
  ) {}

  async createCampaign(data: CreateCampaignDto): Promise<string> {
    try {
      if (!data.title || !data.description) {
        throw new Error('Title and description are required');
      }
      const campaign = new this.campaignModel(data);
      await campaign.save();
      return 'Campaign created successfully';
    } catch (error: any) {
      this.logger.error(
        `Error creating campaign: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getAllCampaigns(query: GetAllCampaignDto): Promise<any> {
    const { page = 1, limit = 10, search, status } = query;

    const skip = (page - 1) * limit;

    const filter: any = {
      isDeleted: false,
    };

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.title = {
        $regex: search,
        $options: 'i',
      };
    }

    const [data, total] = await Promise.all([
      this.campaignModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      this.campaignModel.countDocuments(filter),
    ]);

    return {
      success: true,
      message: 'Campaigns fetched successfully',

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },

      data: data.map((item) => ({
        id: item._id,
        title: item.title,
        description: item.description,
        status: item.status,
      })),
    };
  }

  async getCampaignById(
    data: GetCampaignByIdDto,
  ): Promise<GetCampaignByIdResponseDto> {
    const campaign = await this.campaignModel
      .findOne({
        _id: data.id,
        isDeleted: false,
      })
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return {
      success: true,
      message: 'Campaign fetched successfully',
      data: {
        id: campaign._id.toString(),
        title: campaign.title,
        description: campaign.description,
        status: campaign.status,
      },
    };
  }
}
