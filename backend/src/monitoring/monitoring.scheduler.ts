import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { DIGEST_JOB, MONITORING_OPTIONS } from './monitoring.config';
import type { MonitoringOptions } from './monitoring.config';
import { MonitoringService } from './monitoring.service';

/**
 * El reloj del chequeo. Se registra a mano en vez de con `@Cron` porque la cadencia y
 * la zona horaria se leen del entorno: en plena emergencia, pasar el resumen de seis a
 * dos horas debe ser cambiar una variable en Railway, no redesplegar.
 */
@Injectable()
export class MonitoringScheduler implements OnModuleInit {
  private readonly logger = new Logger(MonitoringScheduler.name);

  constructor(
    private readonly monitoring: MonitoringService,
    private readonly scheduler: SchedulerRegistry,
    @Inject(MONITORING_OPTIONS) private readonly options: MonitoringOptions,
  ) {}

  onModuleInit(): void {
    if (!this.options.enabled) {
      this.logger.warn('Chequeo de acopios apagado por DIGEST_ENABLED');
      return;
    }
    const job = CronJob.from({
      cronTime: this.options.cron,
      timeZone: this.options.timeZone,
      onTick: () => void this.tick(),
      start: true,
    });
    this.scheduler.addCronJob(DIGEST_JOB, job);
    this.logger.log(
      `Chequeo de acopios cada '${this.options.cron}' (${this.options.timeZone}); ` +
        `próxima corrida ${job.nextDate().toISO()}`,
    );
  }

  /**
   * Un fallo del chequeo no puede tumbar el API: en Node una promesa rechazada sin
   * capturar mata el proceso, y con él se irían el mapa y las alertas en vivo.
   */
  private async tick(): Promise<void> {
    try {
      await this.monitoring.runDigest();
    } catch (error) {
      this.logger.error(
        'El chequeo de acopios falló',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
