import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutingRulesService } from './routing-rules.service';
import { RoutingRulesController } from './routing-rules.controller';
import { RoutingRule } from './entities/routing-rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoutingRule])],
  controllers: [RoutingRulesController],
  providers: [RoutingRulesService],
  exports: [RoutingRulesService],
})
export class RoutingRulesModule {}
