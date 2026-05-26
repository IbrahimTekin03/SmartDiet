import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { FoodsService } from './foods.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('foods')
@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get()
  @ApiOperation({ summary: 'List and search foods' })
  async findAll(@Query('search') search?: string) {
    const foods = await this.foodsService.findAll(search);
    return {
      success: true,
      data: foods,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single food' })
  async findOne(@Param('id') id: string) {
    const food = await this.foodsService.findOne(id);
    return {
      success: true,
      data: food,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new food' })
  async create(@Body() createFoodDto: CreateFoodDto) {
    const food = await this.foodsService.create(createFoodDto);
    return {
      success: true,
      data: food,
    };
  }
}
