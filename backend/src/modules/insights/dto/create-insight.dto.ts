import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateInsightDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  topic!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;
}