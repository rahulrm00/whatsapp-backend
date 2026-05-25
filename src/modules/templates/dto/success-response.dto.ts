export class SuccessResponseDto<T> {

  success!: boolean;

  message!: string;

  data!: T;
}