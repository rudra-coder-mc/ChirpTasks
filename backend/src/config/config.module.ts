import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make configuration available globally
    }),
  ],
  exports: [ConfigModule], // Export for use in other modules
})
export class AppConfigModule {}
