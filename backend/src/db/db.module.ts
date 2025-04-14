// src/db/db.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Import ConfigModule
import { dbProvider } from './db.provider';
import { DB_PROVIDER_TOKEN } from './db.constants';

@Global() // Make the DB provider available application-wide without importing DbModule everywhere
@Module({
  imports: [ConfigModule], // Make ConfigService available for injection in dbProvider
  providers: [dbProvider],
  exports: [DB_PROVIDER_TOKEN], // Export the token so it can be injected elsewhere
})
export class DbModule {}
