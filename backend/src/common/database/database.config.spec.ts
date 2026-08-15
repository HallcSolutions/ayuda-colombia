import { buildDatabaseOptions } from './database.config';

describe('buildDatabaseOptions', () => {
  it('usa DATABASE_URL cuando producción entrega una URL completa', () => {
    const options = buildDatabaseOptions({
      DATABASE_URL: 'postgresql://user:secret@postgres.internal:5432/redayuda',
      DB_HOST: 'no-debe-usarse',
    });

    expect(options).toMatchObject({
      type: 'postgres',
      url: 'postgresql://user:secret@postgres.internal:5432/redayuda',
      synchronize: false,
    });
    expect(options).not.toHaveProperty('host');
  });

  it('acepta las variables PG* que exponen proveedores administrados', () => {
    const options = buildDatabaseOptions({
      PGHOST: 'postgres.internal',
      PGPORT: '5432',
      PGUSER: 'redayuda',
      PGPASSWORD: 'secret',
      PGDATABASE: 'production',
    });

    expect(options).toMatchObject({
      host: 'postgres.internal',
      port: 5432,
      username: 'redayuda',
      password: 'secret',
      database: 'production',
    });
  });

  it('solo activa SSL cuando se solicita explícitamente', () => {
    const options = buildDatabaseOptions({
      DATABASE_URL: 'postgresql://example/database',
      DB_SSL: 'true',
      DB_SSL_REJECT_UNAUTHORIZED: 'false',
    });

    expect(options).toMatchObject({
      ssl: { rejectUnauthorized: false },
    });
  });
});
