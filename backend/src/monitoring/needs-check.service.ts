import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import {
  AlertStatus,
  DigestFindingKind,
  ReliefPointStatus,
  ReliefPointType,
  SupplyCategory,
  UrgencyLevel,
} from '../common/constants/app.constants';
import {
  DigestContent,
  DigestFinding,
  DigestNeed,
  DigestPointNeeds,
} from '../common/interfaces/needs-digest.interface';
import { AidAlertEntity } from '../alerts/infrastructure/entities/aid-alert.entity';
import { MealServiceEntity } from '../meals/infrastructure/entities/meal-service.entity';
import { ReliefPointEntity } from '../relief-points/infrastructure/entities/relief-point.entity';
import { ReliefPointsService } from '../relief-points/relief-points.service';
import { MONITORING_OPTIONS } from './monitoring.config';
import type { MonitoringOptions } from './monitoring.config';

export interface DigestWindow {
  from: Date;
  to: Date;
}

/** De más grave a menos: decide con qué severidad se muestra un grupo de alertas. */
const SEVERITY_ORDER: Record<UrgencyLevel, number> = {
  [UrgencyLevel.CRITICAL]: 0,
  [UrgencyLevel.HIGH]: 1,
  [UrgencyLevel.MEDIUM]: 2,
  [UrgencyLevel.LOW]: 3,
};

/** Última fecha conocida por punto, tal como la devuelve un `MAX(...) GROUP BY`. */
interface LastActivityRow {
  pointId: string;
  last: Date;
}

const hoursAgo = (from: Date, hours: number): Date =>
  new Date(from.getTime() - hours * 60 * 60 * 1000);

/** Une dos mapas de «última vez» quedándose siempre con la fecha más reciente. */
const mergeLatest = (
  first: Record<string, Date>,
  second: Record<string, Date>,
): Record<string, Date> =>
  Object.entries(second).reduce(
    (merged, [pointId, at]) =>
      merged[pointId] && merged[pointId] > at
        ? merged
        : { ...merged, [pointId]: at },
    { ...first },
  );

/** El día en curso donde ocurre la emergencia, no donde corre el contenedor. */
const dayIn = (at: Date, timeZone: string): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);

/**
 * Las reglas del chequeo: qué acopios aparecieron y qué les hace falta a los que ya
 * estaban. Solo lee y calcula; no guarda, no emite y no sabe que existe un reloj.
 */
@Injectable()
export class NeedsCheckService {
  constructor(
    @InjectRepository(ReliefPointEntity)
    private readonly points: Repository<ReliefPointEntity>,
    @InjectRepository(AidAlertEntity)
    private readonly alerts: Repository<AidAlertEntity>,
    @InjectRepository(MealServiceEntity)
    private readonly meals: Repository<MealServiceEntity>,
    private readonly reliefPoints: ReliefPointsService,
    @Inject(MONITORING_OPTIONS) private readonly options: MonitoringOptions,
  ) {}

  async collect(window: DigestWindow): Promise<DigestContent> {
    const [created, activeAlerts, allPoints, lastAlerts, lastMeals, served] =
      await Promise.all([
        this.points.find({
          where: { createdAt: Between(window.from, window.to) },
          order: { createdAt: 'ASC' },
        }),
        this.alerts.find({
          where: { status: AlertStatus.ACTIVE },
          order: { createdAt: 'ASC' },
        }),
        this.points.find(),
        this.lastActivity(this.alerts.createQueryBuilder('row'), 'createdAt'),
        this.lastActivity(this.meals.createQueryBuilder('row'), 'updatedAt'),
        this.pointsWithUpcomingMeals(window.to),
      ]);

    const needs = this.groupByPoint(activeAlerts);
    const findings = this.findSignals(
      window.to,
      allPoints,
      activeAlerts,
      served,
      mergeLatest(lastAlerts, lastMeals),
    );

    return {
      totals: {
        newPoints: created.length,
        pointsNeedingHelp: needs.length,
        activeAlerts: activeAlerts.length,
        criticalAlerts: activeAlerts.filter(
          (alert) => alert.severity === UrgencyLevel.CRITICAL,
        ).length,
        findings: findings.length,
      },
      newPoints: created.map((point) => this.reliefPoints.toSummary(point)),
      points: needs,
      findings,
    };
  }

  /** Última fecha registrada por punto, para saber de cuáles no se sabe nada hace días. */
  private async lastActivity(
    query: SelectQueryBuilder<ObjectLiteral>,
    column: 'createdAt' | 'updatedAt',
  ): Promise<Record<string, Date>> {
    const rows = await query
      .select('row.reliefPointId', 'pointId')
      .addSelect(`MAX(row.${column})`, 'last')
      .groupBy('row.reliefPointId')
      .getRawMany<LastActivityRow>();
    return Object.fromEntries(rows.map((row) => [row.pointId, row.last]));
  }

  /** Puntos que ya tienen alguna jornada de comida de hoy en adelante. */
  private async pointsWithUpcomingMeals(at: Date): Promise<Set<string>> {
    const rows = await this.meals
      .createQueryBuilder('meal')
      .select('DISTINCT meal.reliefPointId', 'pointId')
      .where('meal.servedOn >= :today', {
        today: dayIn(at, this.options.timeZone),
      })
      .getRawMany<{ pointId: string }>();
    return new Set(rows.map((row) => row.pointId));
  }

  /** Alertas abiertas agrupadas por punto y, dentro de cada punto, por categoría. */
  private groupByPoint(alerts: AidAlertEntity[]): DigestPointNeeds[] {
    const byPoint = new Map<string, AidAlertEntity[]>();
    alerts.forEach((alert) => {
      const group = byPoint.get(alert.reliefPointId) ?? [];
      byPoint.set(alert.reliefPointId, [...group, alert]);
    });

    return [...byPoint.values()]
      .map((group) => ({
        point: this.reliefPoints.toSummary(group[0].reliefPoint),
        needs: this.groupByCategory(group),
        activeAlerts: group.length,
        criticalAlerts: group.filter(
          (alert) => alert.severity === UrgencyLevel.CRITICAL,
        ).length,
        // Vienen ordenadas de la más vieja a la más nueva.
        oldestAlertAt: group[0].createdAt.toISOString(),
      }))
      .sort(
        (first, second) =>
          second.criticalAlerts - first.criticalAlerts ||
          second.activeAlerts - first.activeAlerts ||
          first.oldestAlertAt.localeCompare(second.oldestAlertAt),
      );
  }

  private groupByCategory(alerts: AidAlertEntity[]): DigestNeed[] {
    const byCategory = new Map<SupplyCategory, AidAlertEntity[]>();
    alerts.forEach((alert) => {
      const group = byCategory.get(alert.category) ?? [];
      byCategory.set(alert.category, [...group, alert]);
    });

    return [...byCategory.entries()]
      .map(([category, group]) => ({
        category,
        severity: group
          .map((alert) => alert.severity)
          .reduce((worst, severity) =>
            SEVERITY_ORDER[severity] < SEVERITY_ORDER[worst] ? severity : worst,
          ),
        alerts: group.length,
        requested: [
          ...new Set(
            group.map((alert) => alert.requestedQuantity).filter(Boolean),
          ),
        ],
      }))
      .sort(
        (first, second) =>
          SEVERITY_ORDER[first.severity] - SEVERITY_ORDER[second.severity] ||
          second.alerts - first.alerts,
      );
  }

  /** Lo que no se ve mirando una alerta suelta: lo estancado, lo mudo y lo desactualizado. */
  private findSignals(
    at: Date,
    points: ReliefPointEntity[],
    activeAlerts: AidAlertEntity[],
    servedPointIds: Set<string>,
    lastActivity: Record<string, Date>,
  ): DigestFinding[] {
    const stale = hoursAgo(at, this.options.staleHours);
    const critical = hoursAgo(at, this.options.criticalAgeHours);
    const withAlerts = new Set(
      activeAlerts.map((alert) => alert.reliefPointId),
    );

    const stuck = activeAlerts
      .filter(
        (alert) =>
          alert.severity === UrgencyLevel.CRITICAL &&
          alert.createdAt < critical,
      )
      .map((alert) => ({
        kind: DigestFindingKind.CRITICAL_STALE,
        point: this.reliefPoints.toSummary(alert.reliefPoint),
        since: alert.createdAt.toISOString(),
      }));

    const fromPoints = points.flatMap((point) => {
      const summary = this.reliefPoints.toSummary(point);
      const seen = this.lastSeen(point, lastActivity);
      const signals: DigestFinding[] = [];

      if (point.status !== ReliefPointStatus.ACTIVE) {
        if (point.updatedAt < stale) {
          signals.push({
            kind: DigestFindingKind.STATUS_OUTDATED,
            point: summary,
            since: point.updatedAt.toISOString(),
          });
        }
        return signals;
      }

      if (!withAlerts.has(point.id) && seen < stale) {
        signals.push({
          kind: DigestFindingKind.NO_ACTIVITY,
          point: summary,
          since: seen.toISOString(),
        });
      }
      if (
        point.type === ReliefPointType.COMMUNITY_KITCHEN &&
        !servedPointIds.has(point.id)
      ) {
        signals.push({
          kind: DigestFindingKind.KITCHEN_WITHOUT_SERVICE,
          point: summary,
          since: null,
        });
      }
      return signals;
    });

    return [...stuck, ...fromPoints];
  }

  /** Lo más reciente que le pasó al punto: su propia edición, una alerta o una comida. */
  private lastSeen(
    point: ReliefPointEntity,
    lastActivity: Record<string, Date>,
  ): Date {
    const related = lastActivity[point.id];
    return related && related > point.updatedAt ? related : point.updatedAt;
  }
}
