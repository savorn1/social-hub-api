import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Platform } from '../../common/enums/platform.enum';
import { ConversationStatus } from '../../common/enums/status.enum';
import { Message } from './message.entity';
import { User } from '../../users/entities/user.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  externalId?: string;

  @Column({ type: 'enum', enum: Platform })
  platform: Platform;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.OPEN,
  })
  status: ConversationStatus;

  @Column({ nullable: true })
  contactName?: string;

  @Column({ nullable: true })
  contactId?: string;

  @Column({ nullable: true })
  pageId?: string;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'assignedAgentId' })
  assignedAgent?: User;

  @Column({ nullable: true })
  assignedAgentId?: string;

  @OneToMany(() => Message, (message) => message.conversation, {
    cascade: true,
  })
  messages: Message[];

  @Column({ type: 'simple-array', nullable: true, default: [] })
  labels: string[];

  @Column({ type: 'int', nullable: true })
  csatScore?: number;

  @Column({ type: 'text', nullable: true })
  csatComment?: string;

  @Column({ nullable: true })
  csatSentAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
