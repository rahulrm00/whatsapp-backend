import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class WhatsappService {

  async sendTemplate(
    phone: string,
    templatePayload: any,
  ) {

    try {

      const response =
        await axios.post(
          `${process.env.META_API_BASE_URL}/${process.env.META_API_PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phone,
            type: 'template',
            template: templatePayload,
          },
          {
            timeout: 30000,
            headers: {
              Authorization:
                `Bearer ${process.env.META_API_TOKEN}`,
              'Content-Type':
                'application/json',
            },
          },
        );

      return response.data;

    } catch (error: any) {

      throw {
        status:
          error?.response?.status,

        data:
          error?.response?.data,

        message:
          error?.message,
      };
    }
  }
}