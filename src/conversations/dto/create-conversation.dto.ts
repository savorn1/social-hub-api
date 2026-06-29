import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Platform } from '../../common/enums/platform.enum';

export class CreateConversationDto {
  @ApiProperty({ enum: Platform })
  @IsEnum(Platform)
  platform: Platform;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pageId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  externalId?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
