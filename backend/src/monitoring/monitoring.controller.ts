import {
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  MonitoringStatus,
  NeedsDigest,
} from '../common/interfaces/needs-digest.interface';
import { DigestTokenGuard } from './digest-token.guard';
import { MonitoringService } from './monitoring.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  /** El último resumen generado: qué acopios aparecieron y qué les hace falta. */
  @Get('digest')
  findLast(): Promise<NeedsDigest> {
    return this.monitoringService.findLast();
  }

  /** Si el chequeo sigue vivo. Es la única forma de notar desde fuera que dejó de correr. */
  @Get('status')
  status(): Promise<MonitoringStatus> {
    return this.monitoringService.status();
  }

  /**
   * Disparo manual. Existe para probar el resumen y para que un reloj externo pueda
   * generarlo si algún día el contenedor deja de estar siempre encendido.
   */
  @Post('digest/run')
  @UseGuards(DigestTokenGuard)
  @HttpCode(200)
  async run(): Promise<NeedsDigest> {
    const digest = await this.monitoringService.runDigest();
    if (!digest) {
      throw new ConflictException('Ya hay un resumen generándose ahora mismo');
    }
    return digest;
  }
}
