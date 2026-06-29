import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('business_hours')
export class BusinessHours {
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

  @UpdateDateColumn()
  updatedAt: Date;
}
