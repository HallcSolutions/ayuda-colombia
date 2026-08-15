import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

/** Cierra la publicación institucional aunque el listado ciudadano siga siendo abierto. */
@Injectable()
export class MissingPublisherGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config
      .get<string>('MISSING_PUBLISHER_KEY', '')
      .trim();
    const received = context
      .switchToHttp()
      .getRequest<Request>()
      .header('x-missing-publisher-key')
      ?.trim();
    const first = Buffer.from(received ?? '');
    const second = Buffer.from(expected);
    if (
      !expected ||
      first.length !== second.length ||
      !timingSafeEqual(first, second)
    ) {
      throw new UnauthorizedException(
        'La clave para publicar avisos verificados no es válida',
      );
    }
    return true;
  }
}
