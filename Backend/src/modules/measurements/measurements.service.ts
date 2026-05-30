import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Measurement } from './entities/measurement.entity';
import { UserProfile } from '../users/entities/user.profile.entity';
import { AddMeasurementDto } from './dto/add-measurement.dto';

@Injectable()
export class MeasurementsService {
  constructor(
    @InjectRepository(Measurement)
    private readonly measurementRepository: Repository<Measurement>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
  ) {}

  async add(clientId: string, dto: AddMeasurementDto) {
    const measurement = this.measurementRepository.create({
      client_id: clientId,
      date: dto.date ?? new Date().toISOString().slice(0, 10),
      weight: dto.weight ?? null,
      body_fat: dto.body_fat ?? null,
      height: dto.height ?? null,
      waist: dto.waist ?? null,
      hip: dto.hip ?? null,
      notes: dto.notes ?? null,
    });
    
    const saved = await this.measurementRepository.save(measurement);
    
    if (dto.height) {
      await this.userProfileRepository.update({ user_id: clientId }, { height: dto.height });
    }
    
    return saved;
  }

  async history(clientId: string, days = 30) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const from = fromDate.toISOString().slice(0, 10);

    const items = await this.measurementRepository.find({
      where: {
        client_id: clientId,
        date: MoreThanOrEqual(from),
      },
      order: { date: 'ASC', createdAt: 'ASC' },
    });

    return {
      range_days: days,
      items,
    };
  }
}

