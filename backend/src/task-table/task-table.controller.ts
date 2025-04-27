import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TaskTableService } from './task-table.service';
import { CreateTaskTableDto } from './dto/create-task-table.dto';
import { UpdateTaskTableDto } from './dto/update-task-table.dto';

@Controller('task-table')
export class TaskTableController {
  constructor(private readonly taskTableService: TaskTableService) {}

  @Post()
  create(@Body() createTaskTableDto: CreateTaskTableDto) {
    return this.taskTableService.create(createTaskTableDto);
  }

  @Get()
  findAll() {
    return this.taskTableService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskTableService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskTableDto: UpdateTaskTableDto,
  ) {
    return this.taskTableService.update(+id, updateTaskTableDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskTableService.remove(+id);
  }
}
