import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateActiveSessionDto } from '../dto/CreateActiveSessionDto.dto';
import { UpdateLastAccessedDto } from '../dto/UpdateLastAccessed.dto';
import { UpdateRefreshJtiDto } from '../dto/UpdateRefreshJti.dto';
import { Model } from 'mongoose';
import { ActiveSession, ActiveSessionDocument } from '../schemas/active-session.schema';
import { GetActiveSessionRequestDto } from '../dto/GetActiveSessionResquestDto.dto';
import { GetActiveSessionResponseDto } from '../dto/GetActiveSessionResponseDto.dto';

@Injectable()
export class ActivesessionService {
    constructor(@InjectModel(ActiveSession.name) private readonly activeSessionModel : Model<ActiveSessionDocument>){}

    async createActiveSession(data : CreateActiveSessionDto){
         const session = new this.activeSessionModel(data);
         await session.save()
    }

    async updateLastAccessed(data: UpdateLastAccessedDto) {
        const updated = await this.activeSessionModel.findOneAndUpdate(
           { userId: data.userId, deviceId: data.deviceId, isRevoked: false },
           { $set: { lastAccessedAt: data.timestamp } },
           { new: true , sort: { loginAt : -1 , updatedAt: -1 } }
           );
          if (!updated) return { success: false, message: 'No active session found' };
             return { success: true };
    }


   async updateRefreshJti(data : UpdateRefreshJtiDto){
      const session = await this.activeSessionModel
         .findOne({ userId: data.userId, deviceId: data.deviceId, isRevoked: false, })
         .sort({ updatedAt: -1 , loginAt : -1});

      if (!session) {
         console.warn('⚠️ No active session found to update');
         return;
       }
        console.log('🧐 Existing session:', session);
      const result = await this.activeSessionModel.updateOne(
      { _id: session._id },
        {
        $set: {
            accessTokenJti: data.accessTokenJti,
            refreshTokenJti: data.refreshTokenJti,
            lastAccessedAt: new Date(),
        },
        }
      );

      console.log('🔧 [updateRefreshJti] Update result:', result);

   }

    async revokeForSingleUSer(userId : string , deviceId : string){
       await this.activeSessionModel.updateOne({userId , deviceId , isRevoked : false},{
         $set :{
            isRevoked : true,
            revokedAt : new Date(),
            logoutAt : new Date(),
         }
       })
    }

    async getActiveSession(data : GetActiveSessionRequestDto) : Promise<GetActiveSessionResponseDto>{
      const session = await this.activeSessionModel.findOne({userId: data.userId , deviceId : data.deviceId}).sort({loginAt : -1 , updatedAt : -1});
      const isRevoked = session ? session.isRevoked : false;
      const accessTokenJti = session ? session.accessTokenJti : ""; 
       return { isRevoked , accessTokenJti };
    }

    async getFullActiveSession(userId : string , deviceId : string) : Promise<ActiveSession> {
      const session = await this.activeSessionModel.findOne({userId ,deviceId}).sort({loginAt : -1 , updatedAt : -1});
      if (!session){
       throw new UnauthorizedException('No active session found — re-login required');
      }
      return session as ActiveSession;
    }
}


