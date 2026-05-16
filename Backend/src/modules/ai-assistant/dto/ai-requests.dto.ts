import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class MacroDto {
  @IsNumber()
  @IsOptional()
  calories?: number;

  @IsNumber()
  @IsOptional()
  protein?: number;

  @IsNumber()
  @IsOptional()
  fat?: number;

  @IsNumber()
  @IsOptional()
  carbohydrates?: number;
}

export class GenerateDietPlanDto {
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['daily', 'weekly', 'monthly'])
  planType: 'daily' | 'weekly' | 'monthly';

  @IsNumber()
  @IsNotEmpty()
  dailyCalories: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  goals?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferences?: string[];

  @IsString()
  @IsOptional()
  additionalNotes?: string;
}

export class AskSubstitutionDto {
  @IsString()
  @IsNotEmpty()
  foodName: string;

  @IsObject()
  @IsNotEmpty()
  @Type(() => MacroDto)
  currentMacros: MacroDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferences?: string[];
}

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
