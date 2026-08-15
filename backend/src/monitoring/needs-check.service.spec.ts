import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  AlertStatus,
  DigestFindingKind,
  ReliefPointStatus,
  ReliefPointType,
  SupplyCategory,
  UrgencyLevel,
} from '../common/constants/app.constants';
import { AidAlertEntity } from '../alerts/infrastructure/entities/aid-alert.entity';
import { MealServiceEntity } from '../meals/infrastructure/entities/meal-service.entity';
import { ReliefPointEntity } from '../relief-points/infrastructure/entities/relief-point.entity';
import { ReliefPointsService } from '../relief-points/relief-points.service';
import {
  MONITORING_OPTIONS,
  buildMonitoringOptions,
} from './monitoring.config';
import { NeedsCheckService } from './needs-check.service';

const NOW = new Date('2026-08-13T12:00:00Z');
const hoursBefore = (hours: number): Date =>
  new Date(NOW.getTime() - hours * 60 * 60 * 1000);

const point = (overrides: Partial<ReliefPointEntity> = {}): ReliefPointEntity =>
  ({
    id: 'point-1',
    name: 'Punto de acopio Acopi',
    type: ReliefPointType.COLLECTION_CENTER,
    department: 'Valle del Cauca',
    municipality: 'Yumbo',
    latitude: 3.55,
    longitude: -76.5,
    status: ReliefPointStatus.ACTIVE,
    createdAt: hoursBefore(1),
    updatedAt: hoursBefore(1),
    ...overrides,
  }) as ReliefPointEntity;

const alert = (overrides: Partial<AidAlertEntity> = {}): AidAlertEntity =>
  ({
    id: 'alert-1',
    reliefPointId: 'point-1',
    reliefPoint: point(),
    category: SupplyCategory.WATER,
    severity: UrgencyLevel.HIGH,
    requestedQuantity: '200 botellones',
    status: AlertStatus.ACTIVE,
    createdAt: hoursBefore(1),
    ...overrides,
  }) as AidAlertEntity;

/** Encadena como el `QueryBuilder` real y devuelve las filas que le pasemos. */
const queryBuilder = (rows: unknown[]) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue(rows),
});

interface Fixture {
  created?: ReliefPointEntity[];
  points?: ReliefPointEntity[];
  activeAlerts?: AidAlertEntity[];
  lastAlertByPoint?: { pointId: string; last: Date }[];
  lastMealByPoint?: { pointId: string; last: Date }[];
  pointsWithMeals?: string[];
}

const build = async (fixture: Fixture): Promise<NeedsCheckService> => {
  const moduleRef = await Test.createTestingModule({
    providers: [
      NeedsCheckService,
      {
        provide: getRepositoryToken(ReliefPointEntity),
        useValue: {
          // Con filtro son los creados en la ventana; sin filtro, todos.
          find: jest.fn((options?: unknown) =>
            Promise.resolve(
              options ? (fixture.created ?? []) : (fixture.points ?? []),
            ),
          ),
        },
      },
      {
        provide: getRepositoryToken(AidAlertEntity),
        useValue: {
          find: jest.fn().mockResolvedValue(fixture.activeAlerts ?? []),
          createQueryBuilder: jest.fn(() =>
            queryBuilder(fixture.lastAlertByPoint ?? []),
          ),
        },
      },
      {
        provide: getRepositoryToken(MealServiceEntity),
        useValue: {
          createQueryBuilder: jest.fn((alias: string) =>
            alias === 'meal'
              ? queryBuilder(
                  (fixture.pointsWithMeals ?? []).map((pointId) => ({
                    pointId,
                  })),
                )
              : queryBuilder(fixture.lastMealByPoint ?? []),
          ),
        },
      },
      {
        provide: ReliefPointsService,
        useValue: {
          toSummary: (entity: ReliefPointEntity) => ({
            id: entity.id,
            name: entity.name,
            type: entity.type,
            department: entity.department,
            municipality: entity.municipality,
            latitude: entity.latitude,
            longitude: entity.longitude,
          }),
        },
      },
      { provide: MONITORING_OPTIONS, useValue: buildMonitoringOptions({}) },
    ],
  }).compile();
  return moduleRef.get(NeedsCheckService);
};

const collect = (service: NeedsCheckService) =>
  service.collect({ from: hoursBefore(6), to: NOW });

const kinds = (findings: { kind: DigestFindingKind }[]) =>
  findings.map((finding) => finding.kind);

describe('NeedsCheckService', () => {
  it('reporta los acopios que aparecieron dentro de la ventana', async () => {
    const service = await build({
      created: [point({ id: 'nuevo', name: 'Comedor La Esperanza' })],
      points: [point()],
    });

    const content = await collect(service);

    expect(content.totals.newPoints).toBe(1);
    expect(content.newPoints[0]).toMatchObject({
      id: 'nuevo',
      municipality: 'Yumbo',
    });
  });

  it('agrupa lo que pide un punto por categoría y se queda con la severidad más grave', async () => {
    const service = await build({
      points: [point()],
      activeAlerts: [
        alert({ id: 'a', severity: UrgencyLevel.HIGH }),
        alert({
          id: 'b',
          severity: UrgencyLevel.CRITICAL,
          requestedQuantity: '50 cajas',
        }),
        alert({
          id: 'c',
          category: SupplyCategory.MEDICINE,
          severity: UrgencyLevel.LOW,
          requestedQuantity: '',
        }),
      ],
    });

    const [needs] = (await collect(service)).points;

    expect(needs.activeAlerts).toBe(3);
    expect(needs.criticalAlerts).toBe(1);
    expect(needs.needs[0]).toMatchObject({
      category: SupplyCategory.WATER,
      severity: UrgencyLevel.CRITICAL,
      alerts: 2,
      requested: ['200 botellones', '50 cajas'],
    });
    // La categoría menos grave queda de última y sin cantidades vacías.
    expect(needs.needs[1]).toMatchObject({
      category: SupplyCategory.MEDICINE,
      requested: [],
    });
  });

  it('omite las alertas abiertas que pertenecen a un punto cerrado', async () => {
    const closedPoint = point({ status: ReliefPointStatus.CLOSED });
    const service = await build({
      points: [closedPoint],
      activeAlerts: [alert({ reliefPoint: closedPoint })],
    });

    const content = await collect(service);

    expect(content.points).toEqual([]);
    expect(content.totals.activeAlerts).toBe(0);
    expect(content.totals.pointsNeedingHelp).toBe(0);
  });

  it('señala la alerta crítica que lleva demasiadas horas abierta', async () => {
    const service = await build({
      points: [point()],
      activeAlerts: [
        alert({
          id: 'vieja',
          severity: UrgencyLevel.CRITICAL,
          createdAt: hoursBefore(30),
        }),
        alert({
          id: 'reciente',
          severity: UrgencyLevel.CRITICAL,
          createdAt: hoursBefore(2),
        }),
      ],
    });

    const { findings } = await collect(service);

    expect(kinds(findings)).toEqual([DigestFindingKind.CRITICAL_STALE]);
    expect(findings[0].since).toBe(hoursBefore(30).toISOString());
  });

  it('señala el punto del que no se sabe nada, y no el que tiene alertas abiertas', async () => {
    const mudo = point({ id: 'mudo', updatedAt: hoursBefore(60) });
    const pidiendo = point({ id: 'pidiendo', updatedAt: hoursBefore(60) });
    const service = await build({
      points: [mudo, pidiendo],
      activeAlerts: [alert({ reliefPointId: 'pidiendo' })],
    });

    const { findings } = await collect(service);

    expect(kinds(findings)).toEqual([DigestFindingKind.NO_ACTIVITY]);
    expect(findings[0].point.id).toBe('mudo');
  });

  it('no da por mudo al punto cuya última señal fue una comida reciente', async () => {
    const service = await build({
      points: [point({ updatedAt: hoursBefore(60) })],
      lastMealByPoint: [{ pointId: 'point-1', last: hoursBefore(2) }],
    });

    expect((await collect(service)).findings).toEqual([]);
  });

  it('señala el comedor sin jornadas y respeta el que sí tiene', async () => {
    const sinJornada = point({
      id: 'sin',
      type: ReliefPointType.COMMUNITY_KITCHEN,
    });
    const conJornada = point({
      id: 'con',
      type: ReliefPointType.COMMUNITY_KITCHEN,
    });
    const service = await build({
      points: [sinJornada, conJornada],
      pointsWithMeals: ['con'],
    });

    const { findings } = await collect(service);

    expect(kinds(findings)).toEqual([
      DigestFindingKind.KITCHEN_WITHOUT_SERVICE,
    ]);
    expect(findings[0]).toMatchObject({ point: { id: 'sin' }, since: null });
  });

  it('señala como desactualizado el punto lleno que nadie vuelve a tocar', async () => {
    const service = await build({
      points: [
        point({
          id: 'lleno',
          status: ReliefPointStatus.FULL,
          updatedAt: hoursBefore(60),
        }),
        point({
          id: 'lleno-reciente',
          status: ReliefPointStatus.FULL,
          updatedAt: hoursBefore(2),
        }),
      ],
    });

    const { findings } = await collect(service);

    expect(kinds(findings)).toEqual([DigestFindingKind.STATUS_OUTDATED]);
    expect(findings[0].point.id).toBe('lleno');
  });

  it('no reporta nada cuando el país está al día', async () => {
    const service = await build({ points: [point()] });

    const content = await collect(service);

    expect(content.totals).toEqual({
      newPoints: 0,
      pointsNeedingHelp: 0,
      activeAlerts: 0,
      criticalAlerts: 0,
      findings: 0,
    });
  });
});
