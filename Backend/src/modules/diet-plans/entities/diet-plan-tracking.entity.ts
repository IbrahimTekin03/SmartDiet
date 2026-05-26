import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { DietPlan } from './diet-plan.entity';
import { DietPlanMealItem } from './diet-plan-meal-item.entity';

@Entity('diet_plan_tracking')
@Index(['client_id', 'date'])
export class DietPlanTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  client_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ type: 'uuid' })
  plan_id: string;

  @ManyToOne(() => DietPlan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: DietPlan;

  @Column({ type: 'uuid' })
  meal_item_id: string;

  @ManyToOne(() => DietPlanMealItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meal_item_id' })
  meal_item: DietPlanMealItem;

  @Column({ type: 'date' })
  date: string;

  @Column({ default: false })
  is_consumed: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
