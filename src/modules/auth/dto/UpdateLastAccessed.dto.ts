import { IsDate, IsString } from "class-validator";

export class UpdateLastAccessedDto {
    @IsString()
      userId!: string;
    
    @IsString()
      deviceId!: string;

    @IsDate()
      timestamp!: Date;  
}