import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { AbstractEntity } from '../../common/entities/base.entity';

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
export class Chatbot extends AbstractEntity {
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
}
