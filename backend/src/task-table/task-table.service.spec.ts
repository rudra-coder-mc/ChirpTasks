import { Test, TestingModule } from '@nestjs/testing';
import { TaskTableService } from './task-table.service';

describe('TaskTableService', () => {
  let service: TaskTableService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskTableService],
    }).compile();

    service = module.get<TaskTableService>(TaskTableService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
