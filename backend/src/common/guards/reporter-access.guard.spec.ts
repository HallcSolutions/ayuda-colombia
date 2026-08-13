import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ReporterAccessGuard } from './reporter-access.guard';

describe('ReporterAccessGuard', () => {
  let guard: ReporterAccessGuard;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReporterAccessGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('brigada-uno,brigada-dos'),
          },
        },
      ],
    }).compile();
    guard = module.get(ReporterAccessGuard);
  });

  it('permite un código de brigada configurado', () => {
    expect(guard.canActivate(contextWithCode('brigada-dos'))).toBe(true);
  });

  it('rechaza peticiones públicas que intentan escribir', () => {
    expect(() => guard.canActivate(contextWithCode(undefined))).toThrow(
      UnauthorizedException,
    );
  });
});

function contextWithCode(code: string | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ header: () => code }),
    }),
  } as ExecutionContext;
}
