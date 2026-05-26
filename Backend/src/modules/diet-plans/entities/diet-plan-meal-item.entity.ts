import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { DietPlanMeal } from './diet-plan-meal.entity';
import { Food } from '@/modules/foods/entities/food.entity';

@Entity('diet_plan_meal_items')
export class DietPlanMealItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  meal_id: string;

  @ManyToOne(() => DietPlanMeal, (meal) => meal.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meal_id' })
  meal: DietPlanMeal;

  @Column({ type: 'uuid' })
  food_id: string;

  @ManyToOne(() => Food)
  @JoinColumn({ name: 'food_id' })
  food: Food;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  amount: number;
}
