import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { AbstractEntity } from '../../common/entities/base.entity';
import { Platform } from '../../common/enums/platform.enum';

@Entity('inboxes')
export class Inbox extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: Platform })
  platform: Platform;

  @Column({ nullable: true })
  pageId?: string;

  @Column({ nullable: true })
  accessToken?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  config?: Record<string, unknown>;
}
