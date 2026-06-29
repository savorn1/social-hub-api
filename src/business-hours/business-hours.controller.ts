import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BusinessHoursService } from './business-hours.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Business Hours')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('business-hours')
export class BusinessHoursController {
  constructor(private readonly service: BusinessHoursService) {}

  @Get()
  @ApiOperation({ summary: 'Get business hours for all days' })
  findAll() {
    return this.service.findAll();
  }

  @Patch(':day')
  @ApiOperation({ summary: 'Update business hours for a day (0=Sun … 6=Sat)' })
  upsert(
    @Param('day') day: string,
    @Body()
    dto: {
      isEnabled?: boolean;
      startTime?: string;
      endTime?: string;
      timezone?: string;
    },
  ) {
    return this.service.upsert(+day, dto);
  }
}
