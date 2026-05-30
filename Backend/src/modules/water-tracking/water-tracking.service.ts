import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { WaterTracking } from './entities/water-tracking.entity';
import { AddWaterDto } from './dto/add-water.dto';

@Injectable()
export class WaterTrackingService {
  constructor(
    @InjectRepository(WaterTracking)
    private readonly waterRepository: Repository<WaterTracking>,
  ) {}

  async getToday(clientId: string, dateStr?: string) {
    const targetDate = dateStr ?? new Date().toISOString().slice(0, 10);
    let record = await this.waterRepository.findOne({
      where: {
        client_id: clientId,
        date: targetDate,
      },
    });

    if (!record) {
      record = this.waterRepository.create({
        client_id: clientId,
        date: targetDate,
        amount: 0,
      });
      await this.waterRepository.save(record);
    }
    return record;
  }

  async addOrUpdate(clientId: string, dto: AddWaterDto) {
    const targetDate = dto.date ?? new Date().toISOString().slice(0, 10);
    
    let record = await this.waterRepository.findOne({
      where: {
        client_id: clientId,
        date: targetDate,
      },
    });

    if (record) {
      record.amount = dto.amount;
      return this.waterRepository.save(record);
    } else {
      record = this.waterRepository.create({
        client_id: clientId,
        date: targetDate,
        amount: dto.amount,
      });
      return this.waterRepository.save(record);
    }
  }

  async getHistory(clientId: string, days = 7) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const from = fromDate.toISOString().slice(0, 10);

    const items = await this.waterRepository.find({
      where: {
        client_id: clientId,
        date: MoreThanOrEqual(from),
      },
      order: { date: 'ASC' },
    });

    return {
      range_days: days,
      items,
    };
  }
}
