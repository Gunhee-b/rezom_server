import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAnswerDto {
  @IsInt() questionId!: number;
  @IsOptional() @IsString() title?: string;
  @IsString() @IsNotEmpty() body!: string;
}
