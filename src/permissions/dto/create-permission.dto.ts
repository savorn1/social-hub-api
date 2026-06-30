import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ example: 'users:read' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'USERS' })
  @IsString()
  module: string;

  @ApiProperty({ example: 'users' })
  @IsString()
  resource: string;

  @ApiProperty({ example: 'read' })
  @IsString()
  action: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
