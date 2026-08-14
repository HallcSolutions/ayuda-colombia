import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { DigestRunStatus } from '../common/constants/app.constants';
import {
  DigestContent,
  MonitoringStatus,
  NeedsDigest,
} from '../common/interfaces/needs-digest.interface';
import {
  DIGEST_JOB,
  DIGEST_LOCK,
  MONITORING_OPTIONS,
} from './monitoring.config';
import type { MonitoringOptions } from './monitoring.config';
import { MonitoringGateway } from './monitoring.gateway';
import { NeedsDigestEntity } from './infrastructure/entities/needs-digest.entity';
import { NeedsCheckService } from './needs-check.service';

/** Cuántas corridas se miran hacia atrás para contar los fallos seguidos. */
const FAILURE_LOOKBACK = 20;

const EMPTY_CONTENT: DigestContent = {
  totals: {
    newPoints: 0,
    pointsNeedingHelp: 0,
    activeAlerts: 0,
    criticalAlerts: 0,
    findings: 0,
  },
  newPoints: [],
  points: [],
  findings: [],
};

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectRepository(NeedsDigestEntity)
    private readonly repository: Repository<NeedsDigestEntity>,
    private readonly check: NeedsCheckService,
    private readonly gateway: MonitoringGateway,
    private readonly dataSource: DataSource,
    private readonly scheduler: SchedulerRegistry,
    @Inject(MONITORING_OPTIONS) private readonly options: MonitoringOptions,
  ) {}

  /**
   * Genera el resumen. Devuelve `null` cuando otra instancia ya lo está haciendo:
   * el candado se toma sobre una conexión propia porque un `advisory lock` pertenece
   * a la sesión, y con el pool cada consulta podría salir por otra conexión distinta.
   */
  async runDigest(): Promise<NeedsDigest | null> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      const [{ locked }] = (await runner.query(
        'SELECT pg_try_advisory_lock(hashtext($1)) AS locked',
        [DIGEST_LOCK],
      )) as { locked: boolean }[];
      if (!locked) {
        this.logger.warn('Otra instancia ya está generando el resumen');
        return null;
      }
      try {
        return await this.generate();
      } finally {
        await runner.query('SELECT pg_advisory_unlock(hashtext($1))', [
          DIGEST_LOCK,
        ]);
      }
    } finally {
      await runner.release();
    }
  }

  async findLast(): Promise<NeedsDigest> {
    const [last] = await this.repository.find({
      order: { ranAt: 'DESC' },
      take: 1,
    });
    if (!last) {
      throw new NotFoundException('Todavía no se ha generado ningún resumen');
    }
    return this.toContract(last);
  }

  async status(): Promise<MonitoringStatus> {
    const recent = await this.repository.find({
      order: { ranAt: 'DESC' },
      take: FAILURE_LOOKBACK,
    });
    const [last] = recent;
    // Las corridas vienen de la más nueva a la más vieja: los fallos seguidos son las
    // que hay antes de la primera buena.
    const firstOk = recent.findIndex(
      (digest) => digest.status === DigestRunStatus.OK,
    );
    return {
      enabled: this.options.enabled,
      cron: this.options.cron,
      timeZone: this.options.timeZone,
      nextRunAt: this.nextRunAt(),
      lastRunAt: last?.ranAt.toISOString() ?? null,
      lastStatus: last?.status ?? null,
      lastDurationMs: last?.durationMs ?? null,
      consecutiveFailures: firstOk === -1 ? recent.length : firstOk,
    };
  }

  private async generate(): Promise<NeedsDigest> {
    const startedAt = Date.now();
    const windowTo = new Date();
    const windowFrom = await this.windowStart(windowTo);
    try {
      const content = await this.check.collect({
        from: windowFrom,
        to: windowTo,
      });
      const digest = await this.save({
        windowFrom,
        windowTo,
        status: DigestRunStatus.OK,
        error: '',
        durationMs: Date.now() - startedAt,
        content,
      });
      this.logger.log(
        `Resumen listo: ${content.totals.newPoints} acopios nuevos, ` +
          `${content.totals.activeAlerts} necesidades activas, ` +
          `${content.totals.findings} señales`,
      );
      this.gateway.digestCreated(digest);
      await this.purgeOld();
      return digest;
    } catch (error) {
      // La corrida fallida también se guarda: si no, el chequeo puede llevar días
      // muerto y desde fuera se vería igual que un país sin novedades.
      const message = error instanceof Error ? error.message : String(error);
      await this.save({
        windowFrom,
        windowTo,
        status: DigestRunStatus.FAILED,
        error: message.slice(0, 500),
        durationMs: Date.now() - startedAt,
        content: EMPTY_CONTENT,
      });
      throw error;
    }
  }

  /**
   * Donde terminó la última corrida buena, no «hace seis horas»: si el contenedor
   * estuvo caído o se redesplegó, la siguiente corrida recupera lo que se perdió.
   */
  private async windowStart(now: Date): Promise<Date> {
    const [lastOk] = await this.repository.find({
      where: { status: DigestRunStatus.OK },
      order: { ranAt: 'DESC' },
      take: 1,
    });
    return (
      lastOk?.windowTo ??
      new Date(now.getTime() - this.options.windowHours * 60 * 60 * 1000)
    );
  }

  private async save(values: Partial<NeedsDigestEntity>): Promise<NeedsDigest> {
    return this.toContract(
      await this.repository.save(this.repository.create(values)),
    );
  }

  private async purgeOld(): Promise<void> {
    const limit = new Date();
    limit.setDate(limit.getDate() - this.options.retentionDays);
    await this.repository.delete({ ranAt: LessThan(limit) });
  }

  private nextRunAt(): string | null {
    try {
      return this.scheduler.getCronJob(DIGEST_JOB).nextDate().toISO();
    } catch {
      // Sin trabajo registrado (chequeo apagado) no hay próxima corrida que anunciar.
      return null;
    }
  }

  private toContract(entity: NeedsDigestEntity): NeedsDigest {
    return {
      ...entity.content,
      id: entity.id,
      ranAt: entity.ranAt.toISOString(),
      windowFrom: entity.windowFrom.toISOString(),
      windowTo: entity.windowTo.toISOString(),
      status: entity.status,
      error: entity.error || null,
      durationMs: entity.durationMs,
    };
  }
}
