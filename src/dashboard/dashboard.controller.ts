import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get overview statistics' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('conversations-by-platform')
  @ApiOperation({ summary: 'Conversations grouped by platform' })
  getByPlatform() {
    return this.dashboardService.getConversationsByPlatform();
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Recent conversation activity' })
  getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }

  @Get('daily-stats')
  @ApiOperation({ summary: 'Daily conversation counts for the last N days' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getDailyStats(@Query('days') days?: number) {
    return this.dashboardService.getDailyStats(days ? +days : 30);
  }

  @Get('agent-stats')
  @ApiOperation({ summary: 'Per-agent conversation and CSAT stats' })
  getAgentStats() {
    return this.dashboardService.getAgentStats();
  }
}
