import {
  DigestFindingKind,
  DigestRunStatus,
  SupplyCategory,
  UrgencyLevel,
} from '../constants/app.constants';
import { ReliefPointSummary } from './relief-point.model';

export interface DigestNeed {
  category: SupplyCategory;
  severity: UrgencyLevel;
  alerts: number;
  requested: string[];
}

export interface DigestPointNeeds {
  point: ReliefPointSummary;
  needs: DigestNeed[];
  activeAlerts: number;
  criticalAlerts: number;
  oldestAlertAt: string;
}

/** Sin texto: la frase se arma aquí a partir del `kind`, en el idioma elegido. */
export interface DigestFinding {
  kind: DigestFindingKind;
  point: ReliefPointSummary;
  since: string | null;
}

export interface DigestTotals {
  newPoints: number;
  pointsNeedingHelp: number;
  activeAlerts: number;
  criticalAlerts: number;
  findings: number;
}

export interface NeedsDigest {
  id: string;
  ranAt: string;
  windowFrom: string;
  windowTo: string;
  status: DigestRunStatus;
  error: string | null;
  durationMs: number;
  totals: DigestTotals;
  newPoints: ReliefPointSummary[];
  points: DigestPointNeeds[];
  findings: DigestFinding[];
}
