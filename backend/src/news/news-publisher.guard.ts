import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class NewsPublisherGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('NEWS_PUBLISHER_KEY', '').trim();
    const received = context
      .switchToHttp()
      .getRequest<Request>()
      .header('x-news-publisher-key')
      ?.trim();
    if (!expected || !received || !this.matches(received, expected)) {
      throw new UnauthorizedException(
        'La clave para publicar noticias no es válida',
      );
    }
    return true;
  }

  private matches(received: string, expected: string): boolean {
    const first = Buffer.from(received);
    const second = Buffer.from(expected);
    return first.length === second.length && timingSafeEqual(first, second);
  }
}
