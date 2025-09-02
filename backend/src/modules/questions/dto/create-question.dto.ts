import { IsOptional, IsString, IsInt, Min, IsArray, IsBoolean, IsNotEmpty } from 'class-validator'

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  title!: string

  @IsOptional()
  @IsString()
  body?: string

  @IsOptional()
  @IsString()
  content?: string  // Add this field to accept frontend data

  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsBoolean()
  isDaily?: boolean

  // Also accept the fields the frontend is sending
  @IsOptional()
  @IsString()
  conceptSlug?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[]
}
