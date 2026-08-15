import dataSource from '../src/common/database/data-source';
import {
  AlertStatus,
  PublicNewsStatus,
  ReliefPointStatus,
  SupplyCategory,
  UrgencyLevel,
} from '../src/common/constants/app.constants';
import { In } from 'typeorm';
import { AidAlertEntity } from '../src/alerts/infrastructure/entities/aid-alert.entity';
import { ReliefPointEntity } from '../src/relief-points/infrastructure/entities/relief-point.entity';
import { PublicNewsEntity } from '../src/news/infrastructure/entities/public-news.entity';
import {
  VERIFIED_RELIEF_POINTS,
  VerifiedReliefPoint,
} from './verified-relief-points';
import { OBSOLETE_NEWS_SOURCE_URLS, VERIFIED_NEWS } from './verified-news';

const NOTES_LIMIT = 400;

const composeNotes = (point: VerifiedReliefPoint): string => {
  const additionalSources = point.additionalSourceUrls?.length
    ? ` Fuentes adicionales: ${point.additionalSourceUrls.join(' ')}`
    : '';
  const source = `Fuente: ${point.sourceLabel} — ${point.sourceUrl}${additionalSources}`;
  const description = [
    `Verificado: ${point.verifiedAt}.`,
    point.needs ? `Se recibe: ${point.needs}` : null,
    point.caveat,
  ]
    .filter(Boolean)
    .join(' ');
  const available = NOTES_LIMIT - source.length - 1;
  if (description.length <= available) return `${description} ${source}`;
  const clipped = description.slice(0, Math.max(available - 1, 0)).trimEnd();
  const wordBoundary = clipped.lastIndexOf(' ');
  const readableClip =
    wordBoundary >= clipped.length * 0.7
      ? clipped.slice(0, wordBoundary)
      : clipped;
  return `${readableClip}… ${source}`.slice(-NOTES_LIMIT);
};

async function seed(): Promise<void> {
  const source = await dataSource.initialize();
  const repository = source.getRepository(ReliefPointEntity);
  const alertsRepository = source.getRepository(AidAlertEntity);
  const newsRepository = source.getRepository(PublicNewsEntity);
  let created = 0;
  let updated = 0;
  let alertsCreated = 0;
  let alertsUpdated = 0;
  let alertsResolved = 0;
  let newsCreated = 0;
  let newsUpdated = 0;
  let newsArchived = 0;

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
        verifiedBy: point.sourceLabel.slice(0, 120),
        verifiedAt: new Date(`${point.verifiedAt}T12:00:00-05:00`),
      };

      let savedPoint: ReliefPointEntity;
      if (existing) {
        savedPoint = await repository.save(repository.merge(existing, values));
        updated += 1;
      } else {
        savedPoint = await repository.save(repository.create(values));
        created += 1;
      }

      const activeAlerts = await alertsRepository.find({
        where: {
          reliefPointId: savedPoint.id,
          status: AlertStatus.ACTIVE,
        },
      });
      if (point.status === ReliefPointStatus.CLOSED) {
        for (const activeAlert of activeAlerts) {
          await alertsRepository.save(
            alertsRepository.merge(activeAlert, {
              status: AlertStatus.RESOLVED,
              resolvedAt: new Date(),
            }),
          );
          alertsResolved += 1;
        }
        continue;
      }
      // Un servicio sin pedido editorial sigue aceptando alertas ciudadanas; la
      // semilla simplemente no inventa una necesidad ni cierra las que ya existan.
      if (!point.needs.trim()) continue;

      const alertTitle = point.alertTitle ?? 'Necesidades verificadas';
      const existingAlert = activeAlerts.find(
        (activeAlert) => activeAlert.title === alertTitle,
      );
      const alertValues: Partial<AidAlertEntity> = {
        reliefPointId: savedPoint.id,
        category: point.alertCategory ?? SupplyCategory.OTHER,
        severity: point.alertSeverity ?? UrgencyLevel.HIGH,
        title: alertTitle,
        message: point.needs,
        requestedQuantity: 'Ver detalle del punto',
        createdBy: (point.alertCreatedBy ?? point.sourceLabel).slice(0, 80),
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

    const verifiedAt = new Date('2026-08-15T12:00:00-05:00');
    const archivedResult = await newsRepository.update(
      { sourceUrl: In(OBSOLETE_NEWS_SOURCE_URLS) },
      { status: PublicNewsStatus.ARCHIVED },
    );
    newsArchived = archivedResult.affected ?? 0;
    for (const news of VERIFIED_NEWS) {
      const existing = await newsRepository.findOneBy({
        sourceUrl: news.sourceUrl,
      });
      const values: Partial<PublicNewsEntity> = {
        ...news,
        publishedAt: new Date(news.publishedAt),
        validUntil: news.validUntil ? new Date(news.validUntil) : null,
        verifiedAt,
        status: PublicNewsStatus.PUBLISHED,
      };
      if (existing) {
        await newsRepository.save(newsRepository.merge(existing, values));
        newsUpdated += 1;
      } else {
        await newsRepository.save(newsRepository.create(values));
        newsCreated += 1;
      }
    }

    console.log(
      `Puntos verificados: ${created} creados, ${updated} actualizados, ` +
        `${VERIFIED_RELIEF_POINTS.length} procesados. Alertas: ${alertsCreated} creadas, ` +
        `${alertsUpdated} actualizadas, ${alertsResolved} cerradas.`,
    );
    console.log(
      `Noticias de desastres: ${newsCreated} creadas, ${newsUpdated} actualizadas, ` +
        `${newsArchived} publicaciones generales archivadas.`,
    );
  } finally {
    await source.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error('No se pudieron sembrar los puntos verificados:', error);
  process.exit(1);
});
