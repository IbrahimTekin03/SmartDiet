import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Food } from './entities/food.entity';
import { CreateFoodDto } from './dto/create-food.dto';

@Injectable()
export class FoodsService {
  constructor(
    @InjectRepository(Food)
    private readonly foodRepository: Repository<Food>,
  ) {}

  async findAll(search?: string) {
    if (search) {
      return this.foodRepository.find({
        where: [
          { name: ILike(`%${search}%`) },
        ],
        take: 20,
      });
    }
    return this.foodRepository.find({
      take: 20,
    });
  }

  async findOne(id: string) {
    return this.foodRepository.findOne({ where: { id } });
  }

  async create(createFoodDto: CreateFoodDto) {
    const food = this.foodRepository.create(createFoodDto);
    return this.foodRepository.save(food);
  }
}
