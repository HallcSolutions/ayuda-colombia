import { DataSource } from 'typeorm';
import dataSource from '../src/common/database/data-source';

/**
 * ¿La está usando alguien de verdad? Todo sale de lo que ya se guarda: no hace falta
 * instrumentar nada. Se separan dos preguntas que no son la misma:
 *
 *  - Publicar es entrar una vez y dejar un dato.
 *  - Volver (ocupar un cupo, cerrar una alerta, mover un camión) es que la red sirvió.
 *
 * Una base llena de publicaciones y sin señales de vuelta significa que la página se ve
 * pero no se usa, y eso hay que poder verlo de un vistazo.
 */

const DEFAULT_DAYS = 14;

/**
 * En Railway la base solo se ve desde dentro (`postgres.railway.internal`), así que para
 * mirar producción desde un portátil se usa la URL pública del servicio de Postgres:
 *
 *   railway run --service Postgres npm run uso
 *
 * Sin esa variable se consulta la base de siempre (la del `.env` o la de Docker).
 */
const connect = (): Promise<DataSource> => {
  const url = process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL;
  if (!url) return dataSource.initialize();
  return new DataSource({ type: 'postgres', url }).initialize();
};

const describe = (source: DataSource): string => {
  const { database, host } = source.options as {
    database?: string;
    host?: string;
  };
  return `${String(database)} en ${String(host)}`;
};

/** Publicaciones nuevas por día, de todos los módulos, en una sola tabla. */
const ACTIVITY_SQL = `
  select to_char(fecha, 'YYYY-MM-DD') as dia,
         sum(reportes)::int as reportes,
         sum(puntos)::int as puntos,
         sum(dormidas)::int as dormidas,
         sum(alertas)::int as alertas,
         sum(desaparecidos)::int as desaparecidos,
         sum(camiones)::int as camiones,
         count(*)::int as total
  from (
    select "createdAt" as fecha, 1 as reportes, 0 as puntos, 0 as dormidas,
           0 as alertas, 0 as desaparecidos, 0 as camiones from house_reports
    union all select "createdAt", 0, 1, 0, 0, 0, 0 from relief_points
    union all select "createdAt", 0, 0, 1, 0, 0, 0 from lodging_offers
    union all select "createdAt", 0, 0, 0, 1, 0, 0 from aid_alerts
    union all select "createdAt", 0, 0, 0, 0, 1, 0 from missing_records
    union all select "createdAt", 0, 0, 0, 0, 0, 1 from convoy_trips
  ) publicaciones
  where fecha > now() - ($1 || ' days')::interval
  group by dia
  order by dia desc
`;

/** Señales de que alguien volvió: son las que distinguen una red viva de un directorio. */
const RETURN_SIGNALS_SQL = `
  select
    (select coalesce(sum("occupiedSpaces"), 0) from lodging_offers)::int as "cupos ocupados",
    (select count(*) from aid_alerts where "resolvedAt" is not null)::int as "alertas atendidas",
    (select coalesce(sum("portionsDelivered"), 0) from meal_services)::int as "raciones entregadas",
    (select count(distinct "tripId") from convoy_pings)::int as "camiones que se movieron",
    (select count(*) from missing_records where status = 'found')::int as "personas encontradas",
    (select count(*) from relief_points where "verifiedBy" <> '')::int as "sitios comprobados",
    (
      (select count(*) from lodging_offers where "updatedAt" > "createdAt" + interval '1 minute')
      + (select count(*) from missing_records where "updatedAt" > "createdAt" + interval '1 minute')
      + (select count(*) from relief_points where "updatedAt" > "createdAt" + interval '1 minute')
    )::int as "publicaciones editadas"
`;

/** Dónde está pasando: un departamento sin publicaciones recientes está muerto. */
const COVERAGE_SQL = `
  select department as departamento,
         count(*)::int as publicaciones,
         to_char(max("createdAt"), 'YYYY-MM-DD HH24:MI') as ultima
  from (
    select department, "createdAt" from house_reports
    union all select department, "createdAt" from relief_points
    union all select department, "createdAt" from lodging_offers
    union all select department, "createdAt" from missing_records
  ) publicaciones
  group by department
  order by publicaciones desc
  limit 10
`;

/** El teléfono es el identificador de hecho de quien publica; no se imprime ninguno. */
const PEOPLE_SQL = `
  select count(distinct "contactPhone")::int as personas
  from (
    select "contactPhone" from house_reports
    union all select "contactPhone" from relief_points
    union all select "contactPhone" from lodging_offers
    union all select "contactPhone" from missing_records
  ) contactos
  where "contactPhone" <> ''
`;

/**
 * Una siembra mete decenas de filas en el mismo minuto; una persona, una cada vez.
 * Sin esto, un `db:seed` se lee como un día de uso intenso.
 */
const BULK_SQL = `
  select to_char(minuto, 'YYYY-MM-DD HH24:MI') as minuto, filas::int as filas
  from (
    select date_trunc('minute', fecha) as minuto, count(*) as filas
    from (
      select "createdAt" as fecha from house_reports
      union all select "createdAt" from relief_points
      union all select "createdAt" from lodging_offers
      union all select "createdAt" from missing_records
    ) publicaciones
    group by minuto
  ) por_minuto
  where filas >= 10
  order by filas desc
  limit 3
`;

type Row = Record<string, string | number>;

const sum = (rows: Row[], column: string): number =>
  rows.reduce((total, row) => total + Number(row[column] ?? 0), 0);

const verdict = (published: number, returned: number, days: number): string => {
  if (!published && !returned)
    return `SIN USO: nadie publicó nada en ${days} días.`;
  if (!returned)
    return `SE PUBLICA, PERO NADIE VUELVE: ${published} publicación(es) en ${days} días y ninguna señal de que la ayuda se haya movido. Revisa si la gente encuentra la página o si se atasca al usarla.`;
  if (!published)
    return `SE USA LO YA PUBLICADO, PERO NO ENTRA NADA NUEVO: ${returned} señal(es) de vuelta y ninguna publicación en ${days} días.`;
  return `SE ESTÁ USANDO: ${published} publicación(es) en ${days} días y ${returned} señal(es) de que la ayuda se movió.`;
};

async function report(): Promise<void> {
  const days = Number(process.argv[2]) || DEFAULT_DAYS;
  const source = await connect();

  try {
    console.log(`\nUso de RedAyuda — últimos ${days} días`);
    console.log(`Base consultada: ${describe(source)}\n`);

    const activity: Row[] = await source.query(ACTIVITY_SQL, [String(days)]);
    console.log(`Publicaciones por día (${sum(activity, 'total')} en total)`);
    if (activity.length) console.table(activity);
    else console.log('  Ninguna.\n');

    const [signals]: Row[] = await source.query(RETURN_SIGNALS_SQL);
    console.log('Señales de que alguien volvió (histórico completo)');
    console.table([signals]);

    const [people]: Row[] = await source.query(PEOPLE_SQL);
    console.log(
      `Teléfonos distintos detrás de las publicaciones: ${people.personas}\n`,
    );

    const coverage: Row[] = await source.query(COVERAGE_SQL);
    console.log('Dónde está pasando');
    if (coverage.length) console.table(coverage);
    else console.log('  En ningún lado todavía.\n');

    const bulk: Row[] = await source.query(BULK_SQL);
    if (bulk.length) {
      console.log('Ojo: estas cargas son de una siembra, no de personas');
      console.table(bulk);
    }

    const published = sum(activity, 'total');
    const returned =
      sum([signals], 'cupos ocupados') +
      sum([signals], 'alertas atendidas') +
      sum([signals], 'raciones entregadas') +
      sum([signals], 'camiones que se movieron') +
      sum([signals], 'personas encontradas') +
      sum([signals], 'sitios comprobados');

    console.log(verdict(published, returned, days));
    console.log(
      '\nEsto solo mide a quien publica o vuelve. Cuánta gente entra a mirar no se guarda en ninguna parte.\n',
    );
  } finally {
    await source.destroy();
  }
}

report().catch((error) => {
  console.error('No se pudo leer el uso:', error);
  process.exit(1);
});
