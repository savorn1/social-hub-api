import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { AbstractEntity } from '../../common/entities/base.entity';

export enum PromptCategory {
  SYSTEM = 'system',
  SALES = 'sales',
  SUPPORT = 'support',
  MARKETING = 'marketing',
  GENERAL = 'general',
}

@Entity('prompts')
export class Prompt extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: PromptCategory,
    default: PromptCategory.GENERAL,
  })
  category: PromptCategory;

  @Column({ type: 'simple-array', nullable: true })
  variables?: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 1 })
  currentVersion: number;
}
