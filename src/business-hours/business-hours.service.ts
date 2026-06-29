import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessHours } from './entities/business-hours.entity';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Injectable()
export class BusinessHoursService implements OnModuleInit {
  constructor(
    @InjectRepository(BusinessHours)
    private readonly repo: Repository<BusinessHours>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count === 0) {
      // Seed default Mon–Fri 09:00–18:00
      await this.repo.save(
        DAY_NAMES.map((_, day) =>
          this.repo.create({
            dayOfWeek: day,
            isEnabled: day >= 1 && day <= 5,
            startTime: '09:00',
            endTime: '18:00',
          }),
        ),
      );
    }
  }

  async findAll(): Promise<BusinessHours[]> {
    return this.repo.find({ order: { dayOfWeek: 'ASC' } });
  }

  async upsert(
    dayOfWeek: number,
    dto: { isEnabled?: boolean; startTime?: string; endTime?: string; timezone?: string },
  ): Promise<BusinessHours> {
    let record = await this.repo.findOne({ where: { dayOfWeek } });
    if (!record) record = this.repo.create({ dayOfWeek });
    Object.assign(record, dto);
    return this.repo.save(record);
  }

  async isWithinBusinessHours(): Promise<boolean> {
    const now = new Date();
    const day = now.getDay(); // 0–6
    const record = await this.repo.findOne({ where: { dayOfWeek: day } });
    if (!record || !record.isEnabled) return false;

    const [startH, startM] = record.startTime.split(':').map(Number);
    const [endH, endM] = record.endTime.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = (startH ?? 9) * 60 + (startM ?? 0);
    const endMinutes = (endH ?? 18) * 60 + (endM ?? 0);

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  getDayName(day: number): string {
    return DAY_NAMES[day] ?? String(day);
  }
}
