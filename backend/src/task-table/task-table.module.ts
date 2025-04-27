import { Module } from '@nestjs/common';
import { TaskTableService } from './task-table.service';
import { TaskTableController } from './task-table.controller';

@Module({
  controllers: [TaskTableController],
  providers: [TaskTableService],
})
export class TaskTableModule {}
