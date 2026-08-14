import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  DigestFindingKind,
  DigestRunStatus,
  ReliefPointType,
  SupplyCategory,
  UrgencyLevel,
} from '../../../core/constants/app.constants';
import { I18nService, Locale } from '../../../core/i18n/i18n.service';
import { NeedsDigest } from '../../../core/models/needs-digest.model';
import { MonitoringService } from '../../../core/services/monitoring.service';
import { NeedsDigestPanel } from './needs-digest';

// Igual que en `app.config.ts`: sin esto el `DatePipe` no sabe formatear en español.
registerLocaleData(localeEs);
registerLocaleData(localeEn);

const point = (id: string, name: string) => ({
  id,
  name,
  type: ReliefPointType.COMMUNITY_KITCHEN,
  department: 'Valle del Cauca',
  municipality: 'Yumbo',
  latitude: 3.55,
  longitude: -76.5,
});

const DIGEST: NeedsDigest = {
  id: 'digest-1',
  ranAt: '2026-08-13T18:00:00Z',
  windowFrom: '2026-08-13T12:00:00Z',
  windowTo: '2026-08-13T18:00:00Z',
  status: DigestRunStatus.OK,
  error: null,
  durationMs: 30,
  totals: {
    newPoints: 1,
    pointsNeedingHelp: 1,
    activeAlerts: 2,
    criticalAlerts: 1,
    findings: 1,
  },
  newPoints: [point('nuevo', 'Comedor La Esperanza')],
  points: [
    {
      point: point('point-1', 'Punto de acopio Acopi'),
      needs: [
        {
          category: SupplyCategory.WATER,
          severity: UrgencyLevel.CRITICAL,
          alerts: 2,
          requested: ['600 botellones'],
        },
      ],
      activeAlerts: 2,
      criticalAlerts: 1,
      oldestAlertAt: '2026-08-12T10:00:00Z',
    },
  ],
  findings: [
    {
      kind: DigestFindingKind.CRITICAL_STALE,
      point: point('point-1', 'Punto de acopio Acopi'),
      since: '2026-08-12T10:00:00Z',
    },
  ],
};

/** Doble del servicio: el panel solo lee signals, no habla con la API. */
const monitoringStub = (digest: NeedsDigest | null) => {
  const state = signal(digest);
  return {
    digest: state,
    newPoints: signal(digest?.newPoints ?? []),
    pointsNeedingHelp: signal(digest?.points ?? []),
    findings: signal(digest?.findings ?? []),
    activeAlerts: signal(digest?.totals.activeAlerts ?? 0),
    criticalAlerts: signal(digest?.totals.criticalAlerts ?? 0),
    loadDigest: () => undefined,
  };
};

const render = async (
  digest: NeedsDigest | null,
  locale: Locale = 'es',
): Promise<HTMLElement> => {
  TestBed.configureTestingModule({
    imports: [NeedsDigestPanel],
    providers: [
      provideRouter([]),
      { provide: MonitoringService, useValue: monitoringStub(digest) },
    ],
  });
  // El entorno de pruebas trae el idioma del navegador; aquí se fija a propósito.
  TestBed.inject(I18nService).setLocale(locale);
  const fixture = TestBed.createComponent(NeedsDigestPanel);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

describe('NeedsDigestPanel', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('no ocupa espacio mientras no se haya generado ningún resumen', async () => {
    expect((await render(null)).textContent?.trim()).toBe('');
  });

  it('muestra los contadores del chequeo', async () => {
    const element = await render(DIGEST);

    const counters = [...element.querySelectorAll('.digest-metrics strong')].map(
      (node) => node.textContent,
    );
    expect(counters).toEqual(['1', '2', '1']);
  });

  it('nombra la señal en el idioma elegido, no con la clave del backend', async () => {
    const element = await render(DIGEST);

    expect(element.querySelector('.finding-what')?.textContent?.trim()).toBe(
      'Crítica sin atender',
    );
    expect(element.textContent).toContain('Punto de acopio Acopi');
    expect(element.textContent).not.toContain('critical_stale');
  });

  it('traduce la misma señal cuando la persona lee en inglés', async () => {
    const element = await render(DIGEST, 'en');

    expect(element.querySelector('.finding-what')?.textContent?.trim()).toBe(
      'Critical need unattended',
    );
  });

  it('muestra qué se necesita y cuánto se pidió', async () => {
    const element = await render(DIGEST);

    const need = element.querySelector('.digest-needs li');
    expect(need?.textContent).toContain('Agua potable');
    expect(need?.textContent).toContain('600 botellones');
    expect(need?.className).toContain('severity-critical');
  });

  it('avisa cuando en la zona no hay nada que reportar', async () => {
    const element = await render({
      ...DIGEST,
      newPoints: [],
      points: [],
      findings: [],
      totals: { ...DIGEST.totals, newPoints: 0, pointsNeedingHelp: 0 },
    });

    expect(element.querySelector('.digest-empty')).not.toBeNull();
    expect(element.querySelector('.digest-metrics')).toBeNull();
  });
});
