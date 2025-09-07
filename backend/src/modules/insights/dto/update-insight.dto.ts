import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateInsightDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  topic?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  body?: string;
}