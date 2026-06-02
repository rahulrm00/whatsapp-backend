import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WebhookService } from './webhook.service';

@Controller('webhook/meta')
export class MetaWebhookController {
  constructor(
    private readonly webhookService: WebhookService,
  ) {}

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    return this.webhookService.verify(
      mode,
      token,
      challenge,
    );
  }

  @Post()
  async receiveWebhook(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.webhookService.receive(req);

    return res
      .status(HttpStatus.OK)
      .send('EVENT_RECEIVED');
  }
}