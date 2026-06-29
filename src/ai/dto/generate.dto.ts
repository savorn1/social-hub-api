import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateReplyDto {
  @ApiProperty()
  @IsString()
  conversationId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  promptId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  knowledgeBaseId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({
    description: 'BCP-47 language code to reply in. Auto-detect when omitted.',
  })
  @IsString()
  @IsOptional()
  language?: string;
}

export class ChatCompletionDto {
  @ApiProperty({ type: [Object] })
  @IsArray()
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  temperature?: number;
}
