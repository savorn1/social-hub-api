import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { KnowledgeBase } from './knowledge-base.entity';

@Entity('knowledge_items')
export class KnowledgeItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => KnowledgeBase, (kb) => kb.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'knowledgeBaseId' })
  knowledgeBase: KnowledgeBase;

  @Column()
  knowledgeBaseId: string;

  @Column()
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
