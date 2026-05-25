import { IsString } from "class-validator";


export class UpdateRefreshJtiDto{

    @IsString()
    userId!: string;

    @IsString()
    deviceId!: string;

    @IsString()
    accessTokenJti!: string;

    @IsString()
    refreshTokenJti!: string;
}