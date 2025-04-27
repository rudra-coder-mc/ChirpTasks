import { Test, TestingModule } from '@nestjs/testing';
import { TaskTableController } from './task-table.controller';
import { TaskTableService } from './task-table.service';

describe('TaskTableController', () => {
  let controller: TaskTableController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskTableController],
      providers: [TaskTableService],
    }).compile();

    controller = module.get<TaskTableController>(TaskTableController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
