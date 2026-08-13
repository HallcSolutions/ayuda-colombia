import { join } from 'node:path';
import { DataSourceOptions } from 'typeorm';

type EnvSource = Record<string, string | undefined>;

const readNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * Única definición de la conexión: la usan la app (`app.module.ts`) y el CLI de
 * TypeORM (`data-source.ts`), para que migraciones y runtime nunca se separen.
 */
export function buildDatabaseOptions(
  env: EnvSource = process.env,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: readNumber(env.DB_PORT, 5434),
    username: env.DB_USER ?? 'redayuda_user',
    password: env.DB_PASSWORD ?? 'redayuda_secret',
    database: env.DB_NAME ?? 'redayuda_db',
    entities: [join(__dirname, '..', '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, '..', '..', 'migrations', '*.{ts,js}')],
    // El esquema solo cambia con migraciones versionadas, nunca con `synchronize`.
    synchronize: false,
    migrationsRun: env.DB_RUN_MIGRATIONS !== 'false',
    logging: env.DB_LOGGING === 'true',
  };
}
