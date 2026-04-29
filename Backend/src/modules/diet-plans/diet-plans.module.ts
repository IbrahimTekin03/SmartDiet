import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DietPlansService } from './diet-plans.service';
import { DietPlansController } from './diet-plans.controller';
import { DietPlan } from './entities/diet-plan.entity';
import { DietPlanMeal } from './entities/diet-plan-meal.entity';
import { DietPlanMealItem } from './entities/diet-plan-meal-item.entity';
import { DietPlanTracking } from './entities/diet-plan-tracking.entity';
import { User } from '@/modules/users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DietPlan, DietPlanMeal, DietPlanMealItem, DietPlanTracking, User]),
    NotificationsModule,
  ],
  controllers: [DietPlansController],
  providers: [DietPlansService],
  exports: [DietPlansService],
})
export class DietPlansModule {}
