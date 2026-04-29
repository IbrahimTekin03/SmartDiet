import { IsArray, IsBoolean, IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TrackMealItemDto {
  @IsUUID()
  @IsNotEmpty()
  plan_id: string;

  @IsUUID()
  @IsNotEmpty()
  meal_item_id: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsBoolean()
  @IsNotEmpty()
  is_consumed: boolean;
}

class TrackItemDto {
  @IsUUID()
  @IsNotEmpty()
  meal_item_id: string;

  @IsBoolean()
  @IsNotEmpty()
  is_consumed: boolean;
}

export class TrackMealItemBatchDto {
  @IsUUID()
  @IsNotEmpty()
  plan_id: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackItemDto)
  items: TrackItemDto[];
}
