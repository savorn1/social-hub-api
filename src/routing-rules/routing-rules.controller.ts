import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RoutingRulesService } from './routing-rules.service';
import { RoutingRule } from './entities/routing-rule.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Routing Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('routing-rules')
export class RoutingRulesController {
  constructor(private readonly service: RoutingRulesService) {}

  @Get()
  @ApiOperation({ summary: 'List all routing rules' })
  findAll() { return this.service.findAll(); }

  @Post()
  @ApiOperation({ summary: 'Create a routing rule' })
  create(@Body() dto: Partial<RoutingRule>) { return this.service.create(dto); }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a routing rule' })
  update(@Param('id') id: string, @Body() dto: Partial<RoutingRule>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a routing rule' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
