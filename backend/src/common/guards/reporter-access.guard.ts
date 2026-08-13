import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ReporterAccessGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedCode = request.header('x-reporter-key');
    const configuredCodes = this.configService
      .get<string>('REPORTER_ACCESS_CODES', 'brigada-demo-2026')
      .split(',')
      .map((code) => code.trim())
      .filter(Boolean);

    if (!providedCode || !configuredCodes.includes(providedCode)) {
      throw new UnauthorizedException('Código de reportero inválido');
    }
    return true;
  }
}
