import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AbstractEntity } from '../../common/entities/base.entity';
import { Prompt } from './prompt.entity';

@Entity('prompt_versions')
export class PromptVersion extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Prompt, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promptId' })
  prompt: Prompt;

  @Column()
  promptId: string;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'text' })
  content: string;
}
