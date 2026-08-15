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
  const databaseUrl = env.DATABASE_URL?.trim();
  const connection = databaseUrl
    ? { url: databaseUrl }
    : {
        host: env.DB_HOST ?? env.PGHOST ?? 'localhost',
        port: readNumber(env.DB_PORT ?? env.PGPORT, 5434),
        username: env.DB_USER ?? env.PGUSER ?? 'redayuda_user',
        password: env.DB_PASSWORD ?? env.PGPASSWORD ?? 'redayuda_secret',
        database: env.DB_NAME ?? env.PGDATABASE ?? 'redayuda_db',
      };
  const ssl =
    env.DB_SSL === 'true'
      ? {
          rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        }
      : undefined;

  return {
    type: 'postgres',
    ...connection,
    ...(ssl ? { ssl } : {}),
    entities: [join(__dirname, '..', '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, '..', '..', 'migrations', '*.{ts,js}')],
    // El esquema solo cambia con migraciones versionadas, nunca con `synchronize`.
    synchronize: false,
    migrationsRun: env.DB_RUN_MIGRATIONS !== 'false',
    logging: env.DB_LOGGING === 'true',
  };
}
