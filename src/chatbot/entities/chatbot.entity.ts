import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TriggerType {
  KEYWORD = 'keyword',
  GREETING = 'greeting',
  FALLBACK = 'fallback',
}

export interface FlowStep {
  trigger: TriggerType;
  keywords?: string[];
  response?: string;
  useAI?: boolean;
}

@Entity('chatbots')
export class Chatbot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  knowledgeBaseId?: string;

  @Column({ nullable: true })
  promptId?: string;

  @Column({ nullable: true })
  language?: string;

  @Column({ type: 'jsonb', default: [] })
  flows: FlowStep[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
