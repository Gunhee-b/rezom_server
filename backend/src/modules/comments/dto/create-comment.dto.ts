import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class CreateCommentDto {
  @IsOptional() @IsInt() questionId?: number;
  @IsOptional() @IsInt() answerId?: number;
  @IsString() @IsNotEmpty() body!: string;
}