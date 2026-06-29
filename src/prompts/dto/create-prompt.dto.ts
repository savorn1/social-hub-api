import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromptCategory } from '../entities/prompt.entity';

export class CreatePromptDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ enum: PromptCategory })
  @IsEnum(PromptCategory)
  @IsOptional()
  category?: PromptCategory;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  variables?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
