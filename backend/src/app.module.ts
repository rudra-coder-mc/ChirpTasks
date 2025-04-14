import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env', // Specify the path to your .env file (optional, defaults to .env in root)
      isGlobal: true, // Make the ConfigService available globally
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
