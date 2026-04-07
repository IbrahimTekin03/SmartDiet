import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from './entities/clinic.entity';
import { ClinicsService } from './clinics.service';
import { ClinicsController } from './clinics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Clinic])],
  controllers: [ClinicsController],
  providers: [ClinicsService],
  exports: [ClinicsService],
})
export class ClinicsModule {}
