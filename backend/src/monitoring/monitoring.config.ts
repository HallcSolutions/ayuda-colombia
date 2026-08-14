type EnvSource = Record<string, string | undefined>;

export interface MonitoringOptions {
  enabled: boolean;
  /** Por defecto, cada seis horas en punto. */
  cron: string;
  timeZone: string;
  /** Ventana que se revisa cuando todavía no hay ninguna corrida buena de la cual partir. */
  windowHours: number;
  /** Horas que puede llevar abierta una alerta crítica antes de considerarla estancada. */
  criticalAgeHours: number;
  /** Horas sin novedad tras las cuales un punto se marca como sin señales de vida. */
  staleHours: number;
  /** Días que se conservan los resúmenes anteriores. */
  retentionDays: number;
  /** Llave del disparo manual. Vacía deja el endpoint cerrado. */
  triggerToken: string;
}

const readNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * Única definición del chequeo periódico, con la misma forma que `buildDatabaseOptions`:
 * así el scheduler, las reglas y el estado leen exactamente lo mismo.
 */
export function buildMonitoringOptions(
  env: EnvSource = process.env,
): MonitoringOptions {
  return {
    enabled: env.DIGEST_ENABLED !== 'false',
    cron: env.DIGEST_CRON ?? '0 0 0,6,12,18 * * *',
    // Railway corre en UTC; la hora que le importa a una brigada es la de Colombia.
    timeZone: env.DIGEST_TIMEZONE ?? 'America/Bogota',
    windowHours: readNumber(env.DIGEST_WINDOW_HOURS, 6),
    criticalAgeHours: readNumber(env.DIGEST_CRITICAL_AGE_HOURS, 24),
    staleHours: readNumber(env.DIGEST_STALE_HOURS, 48),
    retentionDays: readNumber(env.DIGEST_RETENTION_DAYS, 90),
    triggerToken: env.DIGEST_TRIGGER_TOKEN ?? '',
  };
}

export const MONITORING_OPTIONS = 'MONITORING_OPTIONS';

/** Nombre del trabajo en el `SchedulerRegistry`: lo registra el scheduler y lo consulta el estado. */
export const DIGEST_JOB = 'needs-digest';

/**
 * Llave del `advisory lock` de Postgres. Railway solapa el contenedor viejo y el nuevo
 * durante un redespliegue: sin esto, el resumen se generaría dos veces en esa ventana.
 */
export const DIGEST_LOCK = 'redayuda:needs-digest';
