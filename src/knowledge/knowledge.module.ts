import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeBase } from './entities/knowledge-base.entity';
import { KnowledgeItem } from './entities/knowledge-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeBase, KnowledgeItem])],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
