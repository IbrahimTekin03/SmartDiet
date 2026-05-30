import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterTracking } from './entities/water-tracking.entity';
import { WaterTrackingService } from './water-tracking.service';
import { WaterTrackingController } from './water-tracking.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WaterTracking])],
  providers: [WaterTrackingService],
  controllers: [WaterTrackingController],
  exports: [WaterTrackingService],
})
export class WaterTrackingModule {}
