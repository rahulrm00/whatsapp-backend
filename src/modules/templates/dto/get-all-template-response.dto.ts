import { PaginationDto } from "./PaginationDto.dto";
import { TemplateResponseDto } from "./template-response.dto";

export class GetAllTemplatesResponseDto {
  success!: boolean;

  message!: string;

  pagination!: PaginationDto;

  data!: TemplateResponseDto[];
}