import { NotFoundException } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DigestRunStatus } from '../common/constants/app.constants';
import { DigestContent } from '../common/interfaces/needs-digest.interface';
import {
  MONITORING_OPTIONS,
  buildMonitoringOptions,
} from './monitoring.config';
import { NeedsDigestEntity } from './infrastructure/entities/needs-digest.entity';
import { MonitoringGateway } from './monitoring.gateway';
import { MonitoringService } from './monitoring.service';
import { NeedsCheckService } from './needs-check.service';

const EMPTY: DigestContent = {
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

const digestRow = (
  overrides: Partial<NeedsDigestEntity> = {},
): NeedsDigestEntity => ({
  id: 'digest-1',
  windowFrom: new Date('2026-08-13T00:00:00Z'),
  windowTo: new Date('2026-08-13T06:00:00Z'),
  status: DigestRunStatus.OK,
  error: '',
  durationMs: 12,
  content: EMPTY,
  ranAt: new Date('2026-08-13T06:00:00Z'),
  ...overrides,
});

describe('MonitoringService', () => {
  let service: MonitoringService;
  let repository: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let check: { collect: jest.Mock };
  let gateway: { digestCreated: jest.Mock };
  let locked: boolean;
  let runner: { connect: jest.Mock; query: jest.Mock; release: jest.Mock };

  beforeEach(async () => {
    locked = true;
    runner = {
      connect: jest.fn(),
      query: jest.fn((sql: string) =>
        Promise.resolve(sql.includes('try_advisory') ? [{ locked }] : []),
      ),
      release: jest.fn(),
    };
    repository = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((values: Partial<NeedsDigestEntity>) =>
        digestRow(values),
      ),
      save: jest.fn((entity: NeedsDigestEntity) => Promise.resolve(entity)),
      delete: jest.fn(),
    };
    check = { collect: jest.fn().mockResolvedValue(EMPTY) };
    gateway = { digestCreated: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        MonitoringService,
        {
          provide: getRepositoryToken(NeedsDigestEntity),
          useValue: repository,
        },
        { provide: NeedsCheckService, useValue: check },
        { provide: MonitoringGateway, useValue: gateway },
        {
          provide: DataSource,
          useValue: { createQueryRunner: () => runner },
        },
        {
          provide: SchedulerRegistry,
          useValue: {
            getCronJob: () => {
              throw new Error('sin trabajo registrado');
            },
          },
        },
        { provide: MONITORING_OPTIONS, useValue: buildMonitoringOptions({}) },
      ],
    }).compile();

    service = moduleRef.get(MonitoringService);
  });

  it('arranca la ventana donde terminó la última corrida buena', async () => {
    const previous = digestRow();
    repository.find.mockResolvedValue([previous]);

    await service.runDigest();

    expect(check.collect).toHaveBeenCalledWith(
      expect.objectContaining({ from: previous.windowTo }),
    );
  });

  it('revisa las últimas horas cuando todavía no hay ninguna corrida buena', async () => {
    await service.runDigest();

    const [[window]] = check.collect.mock.calls as [[{ from: Date; to: Date }]];
    expect(window.to.getTime() - window.from.getTime()).toBe(
      6 * 60 * 60 * 1000,
    );
  });

  it('publica el resumen y limpia los antiguos', async () => {
    const digest = await service.runDigest();

    expect(digest?.status).toBe(DigestRunStatus.OK);
    expect(gateway.digestCreated).toHaveBeenCalledWith(digest);
    expect(repository.delete).toHaveBeenCalled();
  });

  it('deja escrita la corrida fallida y no la publica', async () => {
    check.collect.mockRejectedValue(new Error('la base no responde'));

    await expect(service.runDigest()).rejects.toThrow('la base no responde');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: DigestRunStatus.FAILED,
        error: 'la base no responde',
      }),
    );
    expect(gateway.digestCreated).not.toHaveBeenCalled();
  });

  it('un fallo no adelanta la ventana: la corrida siguiente vuelve a cubrirla', async () => {
    const lastOk = digestRow();
    // `windowStart` solo mira corridas buenas, así que la fallida no cuenta.
    repository.find.mockResolvedValue([lastOk]);
    check.collect.mockRejectedValueOnce(new Error('caída'));

    await expect(service.runDigest()).rejects.toThrow('caída');
    await service.runDigest();

    expect(check.collect).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: lastOk.windowTo }),
    );
  });

  it('no genera nada si otra instancia tiene el candado', async () => {
    locked = false;

    expect(await service.runDigest()).toBeNull();
    expect(check.collect).not.toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalled();
  });

  it('suelta el candado por la misma conexión aunque el chequeo falle', async () => {
    check.collect.mockRejectedValue(new Error('caída'));

    await expect(service.runDigest()).rejects.toThrow('caída');
    expect(runner.query).toHaveBeenCalledWith(
      expect.stringContaining('pg_advisory_unlock'),
      expect.anything(),
    );
    expect(runner.release).toHaveBeenCalled();
  });

  it('cuenta los fallos seguidos desde la corrida más reciente', async () => {
    repository.find.mockResolvedValue([
      digestRow({ status: DigestRunStatus.FAILED }),
      digestRow({ status: DigestRunStatus.FAILED }),
      digestRow(),
    ]);

    const status = await service.status();

    expect(status.consecutiveFailures).toBe(2);
    expect(status.lastStatus).toBe(DigestRunStatus.FAILED);
    expect(status.nextRunAt).toBeNull();
  });

  it('avisa cuando todavía no se ha generado ningún resumen', async () => {
    await expect(service.findLast()).rejects.toBeInstanceOf(NotFoundException);
  });
});
