import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { DbModule } from './db';

@Module({
  imports: [AppConfigModule, DbModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
