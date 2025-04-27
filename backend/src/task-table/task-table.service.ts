import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { CreateTaskTableDto } from './dto/create-task-table.dto';
import { UpdateTaskTableDto } from './dto/update-task-table.dto';
import {
  DB_PROVIDER_TOKEN,
  taskTable,
  DrizzleDatabase,
  NewTaskTable,
} from 'src/db';
import { eq } from 'drizzle-orm';
import { Response } from 'src/utils/response';

@Injectable()
export class TaskTableService {
  constructor(@Inject(DB_PROVIDER_TOKEN) private db: DrizzleDatabase) {}

  create(createTaskTableDto: CreateTaskTableDto): Response<any> {
    try {
      const newTaskTable: NewTaskTable = {
        ...createTaskTableDto,
      };
      const result = this.db.insert(taskTable).values(newTaskTable).returning();
      return Response.success('TaskTable created successfully', result[0]);
    } catch (error) {
      console.error('Error creating taskTable:', error);
      return Response.error(
        'Failed to create taskTable',
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  findAll(): Response<any> {
    try {
      const taskTables = this.db.select().from(taskTable).all();
      return Response.success('TaskTables retrieved successfully', taskTables);
    } catch (error) {
      console.error('Error finding all taskTables:', error);
      return Response.error(
        'Failed to retrieve taskTables',
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  findOne(id: number): Response<any> {
    try {
      const taskTableItem = this.db
        .select()
        .from(taskTable)
        .where(eq(taskTable.id, id))
        .get();
      if (!taskTableItem) {
        return Response.error(
          `TaskTable with ID ${id} not found`,
          undefined,
          HttpStatus.NOT_FOUND,
        );
      }
      return Response.success(
        `TaskTable with ID ${id} retrieved successfully`,
        taskTableItem,
      );
    } catch (error) {
      console.error(`Error finding taskTable with ID ${id}:`, error);
      return Response.error(
        `Failed to find taskTable with ID ${id}`,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  update(id: number, updateTaskTableDto: UpdateTaskTableDto): Response<any> {
    try {
      const updatedTaskTable = {
        ...updateTaskTableDto,
      };
      const result = this.db
        .update(taskTable)
        .set(updatedTaskTable)
        .where(eq(taskTable.id, id))
        .returning();
      if (!result[0]) {
        return Response.error(
          `TaskTable with ID ${id} not found`,
          undefined,
          HttpStatus.NOT_FOUND,
        );
      }
      return Response.success(
        `TaskTable with ID ${id} updated successfully`,
        result[0],
      );
    } catch (error) {
      console.error(`Error updating taskTable with ID ${id}:`, error);
      return Response.error(
        `Failed to update taskTable with ID ${id}`,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  remove(id: number): Response<any> {
    try {
      const result = this.db
        .delete(taskTable)
        .where(eq(taskTable.id, id))
        .returning();
      if (!result[0]) {
        return Response.error(
          `TaskTable with ID ${id} not found`,
          undefined,
          HttpStatus.NOT_FOUND,
        );
      }
      return Response.success(
        `TaskTable with ID ${id} removed successfully`,
        result[0],
      );
    } catch (error) {
      console.error(`Error removing taskTable with ID ${id}:`, error);
      return Response.error(
        `Failed to remove taskTable with ID ${id}`,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
