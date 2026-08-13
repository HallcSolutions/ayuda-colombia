import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from './database.config';

config();

/** DataSource que consume el CLI de TypeORM para generar y correr migraciones. */
export default new DataSource({
  ...buildDatabaseOptions(),
  migrationsRun: false,
});
