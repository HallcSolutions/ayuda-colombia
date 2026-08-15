import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

/** La llave solo habilita revisar; cada decisión además conserva el nombre del revisor. */
@Injectable()
export class RecoveryVerifierGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config
      .get<string>('RECOVERY_VERIFIER_KEY', '')
      .trim();
    const received = context
      .switchToHttp()
      .getRequest<Request>()
      .header('x-recovery-verifier-key')
      ?.trim();
    const first = Buffer.from(received ?? '');
    const second = Buffer.from(expected);
    if (
      !expected ||
      first.length !== second.length ||
      !timingSafeEqual(first, second)
    ) {
      throw new UnauthorizedException(
        'La clave del equipo verificador no es válida',
      );
    }
    return true;
  }
}
