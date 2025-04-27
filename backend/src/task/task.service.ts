import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { DB_PROVIDER_TOKEN, task, DrizzleDatabase, NewTask } from 'src/db';
import { eq } from 'drizzle-orm';
import { Response } from 'src/utils/response';

@Injectable()
export class TaskService {
  constructor(@Inject(DB_PROVIDER_TOKEN) private db: DrizzleDatabase) {}

  create(createTaskDto: CreateTaskDto): Response<any> {
    try {
      const newTask: NewTask = {
        ...createTaskDto,
        startingDate: createTaskDto.startingDate
          ? new Date(createTaskDto.startingDate)
          : null,
        completionDate: createTaskDto.completionDate
          ? new Date(createTaskDto.completionDate)
          : null,
      };
      const result = this.db.insert(task).values(newTask).returning();
      return Response.success('Task created successfully', result[0]);
    } catch (error) {
      console.error('Error creating task:', error);
      return Response.error(
        'Failed to create task',
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  findAll(): Response<any> {
    try {
      const tasks = this.db.select().from(task).all();
      return Response.success('Tasks retrieved successfully', tasks);
    } catch (error) {
      console.error('Error finding all tasks:', error);
      return Response.error(
        'Failed to retrieve tasks',
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  findOne(id: number): Response<any> {
    try {
      const taskItem = this.db.select().from(task).where(eq(task.id, id)).get();
      if (!taskItem) {
        return Response.error(
          `Task with ID ${id} not found`,
          undefined,
          HttpStatus.NOT_FOUND,
        );
      }
      return Response.success(
        `Task with ID ${id} retrieved successfully`,
        taskItem,
      );
    } catch (error) {
      console.error(`Error finding task with ID ${id}:`, error);
      return Response.error(
        `Failed to find task with ID ${id}`,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  update(id: number, updateTaskDto: UpdateTaskDto): Response<any> {
    try {
      const updatedTask = {
        ...updateTaskDto,
        startingDate: updateTaskDto.startingDate
          ? new Date(updateTaskDto.startingDate)
          : null,
        completionDate: updateTaskDto.completionDate
          ? new Date(updateTaskDto.completionDate)
          : null,
      };
      const result = this.db
        .update(task)
        .set(updatedTask)
        .where(eq(task.id, id))
        .returning();
      if (!result[0]) {
        return Response.error(
          `Task with ID ${id} not found`,
          undefined,
          HttpStatus.NOT_FOUND,
        );
      }
      return Response.success(
        `Task with ID ${id} updated successfully`,
        result[0],
      );
    } catch (error) {
      console.error(`Error updating task with ID ${id}:`, error);
      return Response.error(
        `Failed to update task with ID ${id}`,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  remove(id: number): Response<any> {
    try {
      const result = this.db.delete(task).where(eq(task.id, id)).returning();
      if (!result[0]) {
        return Response.error(
          `Task with ID ${id} not found`,
          undefined,
          HttpStatus.NOT_FOUND,
        );
      }
      return Response.success(
        `Task with ID ${id} removed successfully`,
        result[0],
      );
    } catch (error) {
      console.error(`Error removing task with ID ${id}:`, error);
      return Response.error(
        `Failed to remove task with ID ${id}`,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
