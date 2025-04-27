import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { TaskStage, TaskUrgency } from 'src/types/task';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  creatorId: number;

  @IsOptional()
  @IsNumber()
  assigneeId?: number;

  @IsOptional()
  @IsEnum(TaskStage)
  stage?: (typeof TaskStage)[keyof typeof TaskStage];

  @IsOptional()
  @IsEnum(TaskUrgency)
  urgency?: (typeof TaskUrgency)[keyof typeof TaskUrgency];

  @IsOptional()
  @IsDateString()
  startingDate?: string;

  @IsOptional()
  @IsDateString()
  completionDate?: string;
}
