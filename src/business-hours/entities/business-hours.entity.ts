import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { AbstractEntity } from '../../common/entities/base.entity';

@Entity('business_hours')
export class BusinessHours extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'smallint' })
  dayOfWeek: number; // 0 = Sunday … 6 = Saturday

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ default: '09:00' })
  startTime: string; // "HH:MM"

  @Column({ default: '18:00' })
  endTime: string;

  @Column({ default: 'UTC' })
  timezone: string;
}
