import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { UserAssignedDietitian } from '../users/entities/user-assigned-dietitian.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(UserAssignedDietitian)
    private readonly assignmentRepository: Repository<UserAssignedDietitian>,
  ) {}

  async book(clientId: string, dto: CreateAppointmentDto) {
    // 1. Find assigned dietitian
    const assignment = await this.assignmentRepository.findOne({
      where: { clientId: clientId },
    });

    if (!assignment) {
      throw new BadRequestException(
        'Sistemde henüz size tanımlanmış aktif bir diyetisyen bulunmamaktadır. Lütfen klinikten atama yapılmasını bekleyin.',
      );
    }

    // 2. Check if slot is already booked for this dietitian
    const existing = await this.appointmentRepository.findOne({
      where: {
        dietitian_id: assignment.dietitianId,
        date: dto.date,
        time_slot: dto.time_slot,
        status: 'approved',
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Seçilen gün ve saat diliminde diyetisyenin başka bir randevusu bulunmaktadır. Lütfen başka bir saat seçin.',
      );
    }

    // 3. Create appointment
    const appointment = this.appointmentRepository.create({
      client_id: clientId,
      dietitian_id: assignment.dietitianId,
      date: dto.date,
      time_slot: dto.time_slot,
      status: 'pending',
      notes: dto.notes ?? null,
    });

    return this.appointmentRepository.save(appointment);
  }

  async getClientAppointments(clientId: string) {
    return this.appointmentRepository.find({
      where: { client_id: clientId },
      order: { date: 'DESC', time_slot: 'ASC' },
      relations: ['dietitian'],
    });
  }

  async getDietitianSchedule(dietitianId: string) {
    return this.appointmentRepository.find({
      where: { dietitian_id: dietitianId },
      order: { date: 'ASC', time_slot: 'ASC' },
      relations: ['client'],
    });
  }

  async updateStatus(appointmentId: string, dietitianId: string, dto: UpdateAppointmentDto) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId, dietitian_id: dietitianId },
    });

    if (!appointment) {
      throw new NotFoundException('Randevu bulunamadı veya bu işlem için yetkiniz yok.');
    }

    if (dto.status) {
      appointment.status = dto.status;
    }

    if (dto.date) {
      appointment.date = dto.date;
    }

    if (dto.time_slot) {
      // Check if the new slot is taken
      const existing = await this.appointmentRepository.findOne({
        where: {
          dietitian_id: dietitianId,
          date: dto.date ?? appointment.date,
          time_slot: dto.time_slot,
          status: 'approved',
        },
      });

      if (existing && existing.id !== appointmentId) {
        throw new BadRequestException('Seçilen yeni gün ve saat dilimi dolu.');
      }
      
      appointment.time_slot = dto.time_slot;
    }

    if (dto.notes !== undefined) {
      appointment.notes = dto.notes;
    }

    return this.appointmentRepository.save(appointment);
  }

  async getBookedSlots(clientId: string, date: string) {
    const assignment = await this.assignmentRepository.findOne({
      where: { clientId: clientId },
    });
    if (!assignment) return [];

    const booked = await this.appointmentRepository.find({
      where: {
        dietitian_id: assignment.dietitianId,
        date: date,
        status: 'approved',
      },
      select: ['time_slot'],
    });
    return booked.map((b) => b.time_slot);
  }
}
