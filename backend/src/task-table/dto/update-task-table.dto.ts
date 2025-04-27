import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskTableDto } from './create-task-table.dto';

export class UpdateTaskTableDto extends PartialType(CreateTaskTableDto) {}
