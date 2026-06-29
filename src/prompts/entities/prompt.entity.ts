import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PromptCategory {
  SYSTEM = 'system',
  SALES = 'sales',
  SUPPORT = 'support',
  MARKETING = 'marketing',
  GENERAL = 'general',
}

@Entity('prompts')
export class Prompt {
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
