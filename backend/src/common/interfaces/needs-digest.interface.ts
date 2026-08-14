import {
  DigestFindingKind,
  DigestRunStatus,
  SupplyCategory,
  UrgencyLevel,
} from '../constants/app.constants';
import { ReliefPointSummary } from './relief-point.interface';

/** Lo que un punto pide de una misma categoría, ya agrupado. */
export interface DigestNeed {
  category: SupplyCategory;
  /** La más grave de las alertas agrupadas aquí. */
  severity: UrgencyLevel;
  alerts: number;
  /** Cantidades pedidas tal como las escribió quien levantó cada alerta. */
  requested: string[];
}

/** Un punto de acopio con todo lo que le hace falta ahora mismo. */
export interface DigestPointNeeds {
  point: ReliefPointSummary;
  needs: DigestNeed[];
  activeAlerts: number;
  criticalAlerts: number;
  /** La alerta abierta más antigua: cuánto lleva esperando el punto. */
  oldestAlertAt: string;
}

/**
 * Una señal sobre un punto ya registrado. No lleva texto: el catálogo ES/EN vive en el
 * frontend, así que aquí solo viaja el `kind` y los datos para armar la frase.
 */
export interface DigestFinding {
  kind: DigestFindingKind;
  point: ReliefPointSummary;
  /** Desde cuándo arrastra la señal; `null` cuando la señal es una ausencia. */
  since: string | null;
}

export interface DigestTotals {
  newPoints: number;
  pointsNeedingHelp: number;
  activeAlerts: number;
  criticalAlerts: number;
  findings: number;
}

/** Lo que encontró una corrida; se separa del resultado para poder guardar también los fallos. */
export interface DigestContent {
  totals: DigestTotals;
  newPoints: ReliefPointSummary[];
  points: DigestPointNeeds[];
  findings: DigestFinding[];
}

export interface NeedsDigest extends DigestContent {
  id: string;
  ranAt: string;
  /** Ventana revisada. Arranca donde terminó la última corrida buena, no hace seis horas fijas. */
  windowFrom: string;
  windowTo: string;
  status: DigestRunStatus;
  error: string | null;
  durationMs: number;
}

/** Lo justo para saber desde fuera si el chequeo periódico sigue vivo. */
export interface MonitoringStatus {
  enabled: boolean;
  cron: string;
  timeZone: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastStatus: DigestRunStatus | null;
  lastDurationMs: number | null;
  consecutiveFailures: number;
}
