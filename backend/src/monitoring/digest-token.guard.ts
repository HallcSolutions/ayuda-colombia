import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { MONITORING_OPTIONS } from './monitoring.config';
import type { MonitoringOptions } from './monitoring.config';

const HEADER = 'x-digest-token';

const matches = (candidate: string, expected: string): boolean => {
  const received = Buffer.from(candidate);
  const stored = Buffer.from(expected);
  return received.length === stored.length && timingSafeEqual(received, stored);
};

/**
 * Protege el disparo manual del resumen. Sin `DIGEST_TRIGGER_TOKEN` el endpoint queda
 * cerrado: en producción es preferible que no funcione a que quede abierto.
 */
@Injectable()
export class DigestTokenGuard implements CanActivate {
  constructor(
    @Inject(MONITORING_OPTIONS) private readonly options: MonitoringOptions,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.options.triggerToken) {
      throw new UnauthorizedException(
        'El disparo manual del resumen no está habilitado',
      );
    }
    const token = context.switchToHttp().getRequest<Request>().header(HEADER);
    if (!token || !matches(token, this.options.triggerToken)) {
      throw new UnauthorizedException('Token de resumen inválido');
    }
    return true;
  }
}
