import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CampaignContact, CampaignContactDocument } from '../schemas/campaign-contact.schema';

@Injectable()
export class CampaignContactService {
    private readonly logger = new Logger(CampaignContactService.name);
    constructor(
        @InjectModel(CampaignContact.name) private readonly campaignContactModel: Model<CampaignContactDocument>,
    ) {}
   
    async uploadContacts(campaignRunId: string, file : any ) {
        try{

        }catch(error: any) {

        }
    }

}
