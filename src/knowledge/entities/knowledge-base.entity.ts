import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../common/entities/base.entity';
import { KnowledgeItem } from './knowledge-item.entity';

@Entity('knowledge_bases')
export class KnowledgeBase extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => KnowledgeItem, (item) => item.knowledgeBase, {
    cascade: true,
  })
  items: KnowledgeItem[];
}
