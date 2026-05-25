import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';

export interface CreateMetaTemplatePayload {
  name: string;
  category: string;
  language: string;
  parameterFormat: string;
  components: any[];
}

@Injectable()
export class MetaTemplateService {
  private readonly logger =
    new Logger(MetaTemplateService.name);

  private readonly BASE_URL =process.env.META_API_BASE_URL;

  private readonly WABA_ID =
    process.env.META_WABA_ID;

  private readonly META_TOKEN =
    process.env.META_API_TOKEN;

  // =========================
  // COMMON HEADERS
  // =========================

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.META_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }

  // =========================
  // CREATE TEMPLATE
  // =========================

  async createTemplate(
    dto: CreateMetaTemplatePayload,
  ) {
    try {
      const payload = {
        name: dto.name,
        category: dto.category,
        language: dto.language,

        parameter_format:
          dto.parameterFormat.toLowerCase(),

        components: dto.components,
      };

      this.logger.log(
        `Creating Meta template: ${dto.name}`,
      );

      const response = await fetch(
        `${this.BASE_URL}/${this.WABA_ID}/message_templates`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(
          `Meta template creation failed`,
          JSON.stringify(data),
        );

        throw new HttpException(
          {
            success: false,
            message:
              data?.error?.message ||
              'Failed to create template',
            metaError: data,
          },
          response.status,
        );
      }

      this.logger.log(
        `Meta template created successfully: ${data.id}`,
      );

      return {
        success: true,
        message:
          'Template created successfully',
        data,
      };
    } catch (error: any) {
      this.logger.error(
        'Create template exception',
        error?.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message:
            'Unexpected error while creating template',
          error: error?.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =========================
  // DELETE TEMPLATE
  // =========================

  async deleteTemplate(
    templateName: string,
  ) {
    try {
      this.logger.log(
        `Deleting Meta template: ${templateName}`,
      );

      const response = await fetch(
        `${this.BASE_URL}/${this.WABA_ID}/message_templates?name=${templateName}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(
          `Meta template delete failed`,
          JSON.stringify(data),
        );

        throw new HttpException(
          {
            success: false,
            message:
              data?.error?.message ||
              'Failed to delete template',
            metaError: data,
          },
          response.status,
        );
      }

      this.logger.log(
        `Meta template deleted successfully: ${templateName}`,
      );

      return {
        success: true,
        message:
          'Template deleted successfully',
        data,
      };
    } catch (error: any) {
      this.logger.error(
        'Delete template exception',
        error?.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message:
            'Unexpected error while deleting template',
          error: error?.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =========================
  // GET ALL TEMPLATES
  // =========================

  async getTemplates() {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.WABA_ID}/message_templates`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new HttpException(
          {
            success: false,
            message:
              data?.error?.message ||
              'Failed to fetch templates',
            metaError: data,
          },
          response.status,
        );
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message:
            'Unexpected error while fetching templates',
          error: error?.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =========================
  // GET SINGLE TEMPLATE
  // =========================

  async getTemplateByName(
    templateName: string,
  ) {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.WABA_ID}/message_templates?name=${templateName}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new HttpException(
          {
            success: false,
            message:
              data?.error?.message ||
              'Failed to fetch template',
            metaError: data,
          },
          response.status,
        );
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message:
            'Unexpected error while fetching template',
          error: error?.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}