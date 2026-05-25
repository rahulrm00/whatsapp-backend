import { Body, Controller, Logger, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './service/auth.service';
import { RegisterDto } from './dto/RegisterRequestDto.dto';
import { LoginResponseDto } from './dto/LoginResponseDto.dto';
import geoip from 'geoip-lite';
import { V1LoginDto } from './dto/V1.LoginDto.dto';
import { GetTokenDto } from './dto/GetTokenDto.dto';

@Controller('auth')
export class AuthController {
  private readonly authLogger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
  ) {}
  
  @Post('/v1/register')
  async register(@Body() body: RegisterDto) : Promise<string> {
    this.authLogger.log(`Registering user with email: ${body.email}`);
        return await this.authService.register(body);
  }

  @Post('/v1/login')
  async login(
    @Body() body: V1LoginDto,
    @Req() request: Request
  ): Promise<LoginResponseDto> {
    const ipAddress =
      request.ip || (request.headers['x-forwarded-for'] as string) || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';
    const geo = geoip.lookup(ipAddress);
    const country = geo?.country || 'unknown';
    const deviceInfo = {
      appVersion: body.appVersion || 'unknown',
      userAgent: userAgent,
      ipAddress:  ipAddress,
      country: country,
    };

    return await this.authService.login({
      ...body,
      ...deviceInfo,
    });
  }

  @Post('/v1/token')
  async getToken(@Body() body: GetTokenDto): Promise<any> {
    return await this.authService.getToken(body);
  }
}
