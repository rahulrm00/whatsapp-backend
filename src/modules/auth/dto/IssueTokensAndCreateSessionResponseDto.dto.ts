import { IsNumber, IsString } from 'class-validator';

export class IssueTokensAndCreateSessionResponseDto {
  @IsString()
  accessToken!: string;

  @IsString()
  refreshToken!: string;

  @IsNumber()
  accessExp!: number;

  @IsNumber()
  refreshExp!: number;
}