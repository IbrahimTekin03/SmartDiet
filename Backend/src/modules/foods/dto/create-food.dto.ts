import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateFoodDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  calories: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  protein: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  fat: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  carbohydrates: number;

  @IsOptional()
  @IsString()
  unit?: string;
}
