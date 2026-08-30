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
    if (search && search.trim().length > 0) {
      const q = search.trim();
      return this.foodRepository.find({
        where: [
          { name: ILike(`%${q}%`) },
        ],
        order: { name: 'ASC' },
        take: 50,
      });
    }
    return this.foodRepository.find({
      order: { name: 'ASC' },
      take: 50,
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
