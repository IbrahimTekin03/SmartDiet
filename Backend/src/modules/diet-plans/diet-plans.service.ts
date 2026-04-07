import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DietPlan } from './entities/diet-plan.entity';
import { DietPlanMeal } from './entities/diet-plan-meal.entity';
import { DietPlanMealItem } from './entities/diet-plan-meal-item.entity';
import { CreateDietPlanDto } from './dto/create-diet-plan.dto';
import { User } from '@/modules/users/entities/user.entity';

@Injectable()
export class DietPlansService {
  constructor(
    @InjectRepository(DietPlan)
    private readonly dietPlanRepository: Repository<DietPlan>,
    @InjectRepository(DietPlanMeal)
    private readonly mealRepository: Repository<DietPlanMeal>,
    @InjectRepository(DietPlanMealItem)
    private readonly mealItemRepository: Repository<DietPlanMealItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dietitianId: string, dto: CreateDietPlanDto) {
    // 1. Verify client exists
    const client = await this.userRepository.findOne({ where: { id: dto.client_id } });
    if (!client) throw new NotFoundException('Client not found');

    // 2. Use transaction for nested saving
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create and save DietPlan header
      const plan = queryRunner.manager.create(DietPlan, {
        client_id: dto.client_id,
        dietitian_id: dietitianId,
        title: dto.title,
        description: dto.description,
      });
      const savedPlan = await queryRunner.manager.save(plan);

      // Create and save Meals and their Items
      for (const mealDto of dto.meals) {
        const meal = queryRunner.manager.create(DietPlanMeal, {
          plan_id: savedPlan.id,
          name: mealDto.name,
          time: mealDto.time,
          note: mealDto.note,
        });
        const savedMeal = await queryRunner.manager.save(meal);

        for (const itemDto of mealDto.items) {
          const item = queryRunner.manager.create(DietPlanMealItem, {
            meal_id: savedMeal.id,
            food_id: itemDto.food_id,
            amount: itemDto.amount,
          });
          await queryRunner.manager.save(item);
        }
      }

      await queryRunner.commitTransaction();
      return savedPlan;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllByClient(clientId: string) {
    return this.dietPlanRepository.find({
      where: { client_id: clientId },
      relations: ['meals', 'meals.items', 'meals.items.food'],
      order: { createdAt: 'DESC' },
    });
  }
}
