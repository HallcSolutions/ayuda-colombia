import dataSource from '../src/common/database/data-source';
import {
  AlertStatus,
  SupplyCategory,
  UrgencyLevel,
} from '../src/common/constants/app.constants';
import { AidAlertEntity } from '../src/alerts/infrastructure/entities/aid-alert.entity';
import { ReliefPointEntity } from '../src/relief-points/infrastructure/entities/relief-point.entity';
import {
  VERIFIED_RELIEF_POINTS,
  VerifiedReliefPoint,
} from './verified-relief-points';

const composeNotes = (point: VerifiedReliefPoint): string =>
  [
    `Verificado: ${point.verifiedAt}.`,
    `Se recibe: ${point.needs}`,
    point.caveat,
    `Fuente: ${point.sourceLabel} — ${point.sourceUrl}`,
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, 400);

async function seed(): Promise<void> {
  const source = await dataSource.initialize();
  const repository = source.getRepository(ReliefPointEntity);
  const alertsRepository = source.getRepository(AidAlertEntity);
  let created = 0;
  let updated = 0;
  let alertsCreated = 0;
  let alertsUpdated = 0;

  try {
    for (const point of VERIFIED_RELIEF_POINTS) {
      const existing = await repository.findOne({
        where: { name: point.name },
      });
      const values: Partial<ReliefPointEntity> = {
        name: point.name,
        type: point.type,
        department: point.department,
        municipality: point.municipality,
        addressReference: point.addressReference,
        latitude: point.latitude,
        longitude: point.longitude,
        contactName: point.contactName,
        contactPhone: point.contactPhone,
        schedule: point.schedule,
        dailyMealCapacity: null,
        status: point.status,
        notes: composeNotes(point),
      };

      let savedPoint: ReliefPointEntity;
      if (existing) {
        savedPoint = await repository.save(repository.merge(existing, values));
        updated += 1;
      } else {
        savedPoint = await repository.save(repository.create(values));
        created += 1;
      }

      const existingAlert = await alertsRepository.findOne({
        where: {
          reliefPointId: savedPoint.id,
          title: 'Necesidades verificadas',
          status: AlertStatus.ACTIVE,
        },
      });
      const alertValues: Partial<AidAlertEntity> = {
        reliefPointId: savedPoint.id,
        category: SupplyCategory.OTHER,
        severity: UrgencyLevel.HIGH,
        title: 'Necesidades verificadas',
        message: point.needs,
        requestedQuantity: 'Ver detalle del punto',
        createdBy: point.sourceLabel.slice(0, 80),
        status: AlertStatus.ACTIVE,
        resolvedAt: null,
      };
      if (existingAlert) {
        await alertsRepository.save(
          alertsRepository.merge(existingAlert, alertValues),
        );
        alertsUpdated += 1;
      } else {
        await alertsRepository.save(alertsRepository.create(alertValues));
        alertsCreated += 1;
      }
    }

    console.log(
      `Puntos verificados: ${created} creados, ${updated} actualizados, ` +
        `${VERIFIED_RELIEF_POINTS.length} procesados. Alertas: ${alertsCreated} creadas, ` +
        `${alertsUpdated} actualizadas.`,
    );
  } finally {
    await source.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error('No se pudieron sembrar los puntos verificados:', error);
  process.exit(1);
});
