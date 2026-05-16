import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import { AiChatService } from './ai-chat.service';
import { AiChatSession } from './entities/ai-chat-session.entity';
import { DietPlansModule } from '../diet-plans/diet-plans.module';
import { FoodsModule } from '../foods/foods.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiChatSession]),
    DietPlansModule,
    FoodsModule,
    UsersModule,
  ],
  controllers: [AiAssistantController],
  providers: [AiAssistantService, AiChatService],
  exports: [AiAssistantService, AiChatService],
})
export class AiAssistantModule {}
