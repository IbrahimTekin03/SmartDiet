import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DietPlan } from './entities/diet-plan.entity';
import { DietPlanMeal } from './entities/diet-plan-meal.entity';
import { DietPlanMealItem } from './entities/diet-plan-meal-item.entity';
import { DietPlanTracking } from './entities/diet-plan-tracking.entity';
import { CreateDietPlanDto } from './dto/create-diet-plan.dto';
import { User } from '@/modules/users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DietPlansService {
  constructor(
    @InjectRepository(DietPlan)
    private readonly dietPlanRepository: Repository<DietPlan>,
    @InjectRepository(DietPlanMeal)
    private readonly mealRepository: Repository<DietPlanMeal>,
    @InjectRepository(DietPlanMealItem)
    private readonly mealItemRepository: Repository<DietPlanMealItem>,
    @InjectRepository(DietPlanTracking)
    private readonly trackingRepository: Repository<DietPlanTracking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
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
        plan_type: dto.plan_type || 'weekly',
      });
      const savedPlan = await queryRunner.manager.save(plan);

      // Create and save Meals and their Items
      for (const mealDto of dto.meals) {
        const meal = queryRunner.manager.create(DietPlanMeal, {
          plan_id: savedPlan.id,
          name: mealDto.name,
          time: mealDto.time,
          note: mealDto.note,
          day_of_week: mealDto.day_of_week,
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

      await this.notificationsService.create(
        dto.client_id,
        'Yeni Diyet Planı',
        `Diyetisyeniniz tarafından '${dto.title}' başlıklı yeni bir diyet planı oluşturuldu.`
      );

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

  async findOne(id: string, userId: string) {
    const plan = await this.dietPlanRepository.findOne({
      where: [
        { id, client_id: userId },
        { id, dietitian_id: userId }
      ],
      relations: ['meals', 'meals.items', 'meals.items.food'],
    });
    if (!plan) throw new NotFoundException('Diyet planı bulunamadı');
    return plan;
  }

  async trackMealItem(userId: string, planId: string, mealItemId: string, date: string, isConsumed: boolean) {
    const plan = await this.dietPlanRepository.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Diyet planı bulunamadı');
    const clientId = plan.client_id;

    let tracking = await this.trackingRepository.findOne({
      where: { client_id: clientId, plan_id: planId, meal_item_id: mealItemId, date },
    });

    if (tracking) {
      tracking.is_consumed = isConsumed;
    } else {
      tracking = this.trackingRepository.create({
        client_id: clientId,
        plan_id: planId,
        meal_item_id: mealItemId,
        date,
        is_consumed: isConsumed,
      });
    }

    return this.trackingRepository.save(tracking);
  }

  async getTracking(userId: string, planId: string, date: string) {
    const plan = await this.dietPlanRepository.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Diyet planı bulunamadı');
    const clientId = plan.client_id;

    return this.trackingRepository.find({
      where: { client_id: clientId, plan_id: planId, date },
    });
  }

  async trackMealItemBatch(userId: string, planId: string, date: string, items: { meal_item_id: string, is_consumed: boolean }[]) {
    const plan = await this.dietPlanRepository.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Diyet planı bulunamadı');
    const clientId = plan.client_id;

    // 1. Get existing records for this date
    const existing = await this.trackingRepository.find({
      where: { client_id: clientId, plan_id: planId, date },
    });
    
    const trackingMap = new Map(existing.map(t => [t.meal_item_id, t]));
    
    // 2. Prepare upsert operations
    const toSave: DietPlanTracking[] = [];
    
    for (const item of items) {
      const track = trackingMap.get(item.meal_item_id);
      if (track) {
        if (track.is_consumed !== item.is_consumed) {
          track.is_consumed = item.is_consumed;
          toSave.push(track);
        }
      } else {
        toSave.push(this.trackingRepository.create({
          client_id: clientId,
          plan_id: planId,
          meal_item_id: item.meal_item_id,
          date,
          is_consumed: item.is_consumed,
        }));
      }
    }
    
    // 3. Save all in batch
    if (toSave.length > 0) {
      await this.trackingRepository.save(toSave);
    }
    
    return { success: true, updatedCount: toSave.length };
  }

  async updateMealItemFood(mealItemId: string, foodId: string, amount: number) {
    const item = await this.mealItemRepository.findOne({ 
      where: { id: mealItemId }
    });
    if (!item) throw new NotFoundException('Meal item not found');
    
    item.food_id = foodId;
    if (amount !== undefined && amount !== null) {
      item.amount = amount;
    }
    
    const saved = await this.mealItemRepository.save(item);
    return this.mealItemRepository.findOne({
      where: { id: saved.id },
      relations: ['food']
    });
  }

  async deleteMealItem(mealItemId: string) {
    const item = await this.mealItemRepository.findOne({ where: { id: mealItemId } });
    if (!item) throw new NotFoundException('Meal item not found');
    return this.mealItemRepository.remove(item);
  }
}
