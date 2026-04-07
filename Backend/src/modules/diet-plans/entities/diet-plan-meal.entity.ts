import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { DietPlan } from './diet-plan.entity';
import { DietPlanMealItem } from './diet-plan-meal-item.entity';

@Entity('diet_plan_meals')
export class DietPlanMeal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  plan_id: string;

  @ManyToOne(() => DietPlan, (plan) => plan.meals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: DietPlan;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  time: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @OneToMany(() => DietPlanMealItem, (item) => item.meal, { cascade: true })
  items: DietPlanMealItem[];
}
