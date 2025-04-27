import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { DbModule } from './db';
import { AuthModule } from './auth/auth.module';
import { TransformInterceptor } from './transform.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TaskController } from './task/task.controller';
import { TaskModule } from './task/task.module';
import { TaskTableModule } from './task-table/task-table.module';

@Module({
  imports: [AppConfigModule, DbModule, AuthModule, TaskModule, TaskTableModule],
  controllers: [AppController, TaskController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
