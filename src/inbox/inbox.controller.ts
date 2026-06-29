import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { InboxService } from './inbox.service';
import { CreateInboxDto } from './dto/create-inbox.dto';
import { Platform } from '../common/enums/platform.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Inbox')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inbox')
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create inbox channel' })
  create(@Body() dto: CreateInboxDto) {
    return this.inboxService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List inbox channels' })
  @ApiQuery({ name: 'platform', required: false, enum: Platform })
  findAll(@Query('platform') platform?: Platform) {
    return this.inboxService.findAll(platform);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inbox channel' })
  findOne(@Param('id') id: string) {
    return this.inboxService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update inbox channel' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateInboxDto>) {
    return this.inboxService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete inbox channel' })
  remove(@Param('id') id: string) {
    return this.inboxService.remove(id);
  }
}
