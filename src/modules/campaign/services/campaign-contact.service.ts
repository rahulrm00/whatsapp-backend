import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import * as XLSX from 'xlsx';
import { TemplatesService } from '@modules/templates/services/templates.service';
import {
  CampaignContact,
  CampaignContactDocument,
} from '../schemas/campaign-contact.schema';
import { CampaignContactStatus } from '@common/enum/campaigncontact-status.enum';
import {
  CampaignRun,
  CampaignRunDocument,
} from '../schemas/campaign-run.schema';
import { UploadCampaignContactsResponseDto } from '../dto/UploadcampaignContactsResponse.dto';

@Injectable()
export class CampaignContactService {
  private readonly logger = new Logger(CampaignContactService.name);
  constructor(
    @InjectModel(CampaignContact.name)
    private readonly campaignContactModel: Model<CampaignContactDocument>,
    @InjectModel(CampaignRun.name)
    private readonly campaignRunModel: Model<CampaignRunDocument>,
    private readonly templateService: TemplatesService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async uploadContacts(
    campaignRunId: string,
    file: any,
  ): Promise<UploadCampaignContactsResponseDto> {
    try {
      // validate file
      if (!file) {
        throw new BadRequestException('File is required');
      }

      // validate campaign run
      const campaignRun = await this.campaignRunModel.findById(campaignRunId);

      if (!campaignRun) {
        throw new NotFoundException('Campaign run not found');
      }

      // get template
      const template = await this.templateService.getTemplateById(
        campaignRun.templateId.toString(),
      );

      if (!template) {
        throw new NotFoundException('Template not found');
      }

      // template variables
      const requiredVariables = template.data.variables || [];

      // parse excel
      const workbook = XLSX.read(file.buffer, {
        type: 'buffer',
      });

      // first sheet
      const sheetName = workbook.SheetNames[0];

      // worksheet
      const worksheet = workbook.Sheets[sheetName];

      // rows
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
      });

      if (!rows.length) {
        throw new BadRequestException('Excel is empty');
      }

      // validate headers
      const headers = Object.keys(rows[0]);

      const requiredColumns = ['phone', ...requiredVariables];

      const missingColumns = requiredColumns.filter(
        (column) => !headers.includes(column),
      );

      // missing columns
      if (missingColumns.length) {
        return {
          message: 'Missing required columns',

          totalRows: rows.length,

          successCount: 0,

          failedCount: rows.length,

          missingColumns,

          failedRows: [],
        };
      }

      // valid contacts
      const validContacts: any[] = [];

      // failed rows
      const failedRows: any[] = [];

      let rowNumber = 2;

      // process rows
      for (const row of rows) {
        try {
          // validate phone
          if (!row.phone) {
            failedRows.push({
              row: rowNumber,
              reason: 'Phone number missing',
            });

            rowNumber++;

            continue;
          }

          // validate template variables
          let hasMissingVariable = false;

          for (const variable of requiredVariables) {
            if (
              row[variable] === '' ||
              row[variable] === null ||
              row[variable] === undefined
            ) {
              failedRows.push({
                row: rowNumber,
                reason: `Missing variable: ${variable}`,
              });

              hasMissingVariable = true;

              break;
            }
          }

          if (hasMissingVariable) {
            rowNumber++;

            continue;
          }

          // extract fields
          const { phone, name, email, ...customFields } = row;

          // create contact
          validContacts.push({
            campaignId: campaignRun.campaignId,

            campaignRunId,

            name: String(name || '').trim(),

            phone: String(phone).trim(),

            email: String(email || '').trim(),

            customFields,

            status: CampaignContactStatus.PENDING,
          });
        } catch (error) {
          failedRows.push({
            row: rowNumber,
            reason: 'Invalid row data',
          });
        }

        rowNumber++;
      }

      // insert contacts
      if (validContacts.length) {
        await this.campaignContactModel.insertMany(validContacts, {
          ordered: false,
        });

        // update counts
        await this.campaignRunModel.findByIdAndUpdate(campaignRunId, {
          $inc: {
            totalContacts: validContacts.length,

            pendingCount: validContacts.length,
          },
        });
      }

      // response
      return {
        message: 'Contacts uploaded successfully',

        totalRows: rows.length,

        successCount: validContacts.length,

        failedCount: failedRows.length,

        missingColumns,

        failedRows,
      };
    } catch (error: any) {
      console.error(error);

      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteContacts(campaignRunId: string): Promise<string> {
    try {
      if (!campaignRunId) {
        throw new BadRequestException('Campaign run ID is required');
      }
      const campaignRunExists = await this.campaignRunModel.exists({
        _id: campaignRunId,
        isDeleted: false,
      });
      if (!campaignRunExists) {
        throw new NotFoundException('Campaign run not found');
      }
      await this.campaignContactModel.deleteMany({
        campaignRunId,
        isDeleted: false,
      });
      return 'Contacts deleted successfully';
    } catch (error: any) {
      console.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOneByWamid(wamid: string): Promise<CampaignContactDocument | null> {
    return this.campaignContactModel.findOne({ wamid, isDeleted: false });
  }

  async updateStatus(contactId: string, updateData: any): Promise<void> {
    await this.campaignContactModel.updateOne(
      {
        _id: contactId,
      },
      {
        $set: updateData,
      },
    );
  }
}
