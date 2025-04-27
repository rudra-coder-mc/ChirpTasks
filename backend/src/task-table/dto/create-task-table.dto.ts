import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateTaskTableDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  ownerId: number;
}
