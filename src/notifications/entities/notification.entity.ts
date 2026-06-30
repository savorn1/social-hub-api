import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AbstractEntity } from '../../common/entities/base.entity';
import { NotificationStatus } from '../../common/enums/status.enum';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  NEW_CONVERSATION = 'new_conversation',
  NEW_MESSAGE = 'new_message',
  ASSIGNED = 'assigned',
  RESOLVED = 'resolved',
  MENTION = 'mention',
}

@Entity('notifications')
export class Notification extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  body?: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, unknown>;
}
