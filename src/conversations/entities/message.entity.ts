import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AbstractEntity } from '../../common/entities/base.entity';
import { MessageType } from '../../common/enums/platform.enum';
import { MessageStatus } from '../../common/enums/status.enum';
import { Conversation } from './conversation.entity';

@Entity('messages')
export class Message extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column()
  conversationId: string;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ nullable: true })
  mediaUrl?: string;

  @Column({ default: false })
  isFromContact: boolean;

  @Column({ nullable: true })
  senderId?: string;

  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.SENT })
  status: MessageStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;
}
