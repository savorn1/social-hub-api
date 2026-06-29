import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { KnowledgeItem } from './knowledge-item.entity';

@Entity('knowledge_bases')
export class KnowledgeBase {
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
