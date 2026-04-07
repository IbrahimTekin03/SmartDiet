import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Food } from './entities/food.entity';
import { FoodsService } from './foods.service';
import { FoodsController } from './foods.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Food]),
    AuthModule,
  ],
  providers: [FoodsService],
  controllers: [FoodsController],
  exports: [FoodsService],
})
export class FoodsModule {}
