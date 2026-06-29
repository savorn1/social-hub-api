import {
  IsEnum,
  IsOptional,
  IsUUID,
  IsArray,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationStatus } from '../../common/enums/status.enum';

export class UpdateConversationDto {
  @ApiPropertyOptional({ enum: ConversationStatus })
  @IsEnum(ConversationStatus)
  @IsOptional()
  status?: ConversationStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  assignedAgentId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labels?: string[];

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  csatScore?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  csatComment?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  handoverMode?: boolean;
}
