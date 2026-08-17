import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import {
  AlertStatus,
  ReliefPointStatus,
  ReliefPointType,
  SupplyCategory,
  UrgencyLevel,
} from '../../../core/constants/app.constants';
import { AidAlert } from '../../../core/models/aid-alert.model';
import { ReliefPoint } from '../../../core/models/relief-point.model';
import { AlertsService } from '../../../core/services/alerts.service';
import { MealsService } from '../../../core/services/meals.service';
import { ReliefPointsService } from '../../../core/services/relief-points.service';
import { ReliefPointPage } from './relief-point-page';

const POINT: ReliefPoint = {
  id: '1371f22f-6b87-4a9c-aad6-2f0994387f9a',
  name: 'Albergue comunitario Chiminangos II',
  type: ReliefPointType.SHELTER,
  department: 'Valle del Cauca',
  municipality: 'Cali',
  latitude: 3.4783816,
  longitude: -76.4933235,
  addressReference: 'Calle 62B con Carrera 1A6',
  contactName: 'Comunidad de Chiminangos II',
  contactPhone: 'No publicado',
  schedule: 'Operación comunitaria continua',
  dailyMealCapacity: null,
  status: ReliefPointStatus.ACTIVE,
  notes: 'Necesidades confirmadas mediante fotografía actual tomada en el sitio.',
  verifiedBy: 'Fotografía actual tomada en el sitio',
  verifiedAt: '2026-08-17T01:35:11.221Z',
  createdAt: '2026-08-13T22:08:53.415Z',
  updatedAt: '2026-08-17T01:35:11.219Z',
};

const ALERT: AidAlert = {
  id: '2a0e44e1-2aa9-428f-9f34-4aead4dfa83c',
  reliefPointId: POINT.id,
  reliefPoint: POINT,
  category: SupplyCategory.OTHER,
  severity: UrgencyLevel.HIGH,
  title: 'Lista actual de necesidades — Chiminangos II',
  message: 'Aceite de 250 ml; carpas; linternas y pilas.',
  requestedQuantity: 'Cantidades por confirmar',
  status: AlertStatus.ACTIVE,
  createdBy: 'Fotografía actual tomada en el sitio',
  resolvedAt: null,
  createdAt: '2026-08-17T01:34:09.702Z',
  updatedAt: '2026-08-17T01:34:09.702Z',
};

describe('ReliefPointPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReliefPointPage],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ pointId: POINT.id }),
            },
          },
        },
        {
          provide: ReliefPointsService,
          useValue: {
            points: signal<ReliefPoint[]>([]),
            loadPoint: () => of(POINT),
          },
        },
        {
          provide: AlertsService,
          useValue: {
            activeAlertsOf: () => [],
            loadAlertsForPoint: () => of([ALERT]),
          },
        },
        {
          provide: MealsService,
          useValue: {
            mealServicesOf: () => [],
            loadMealServicesForPoint: () => of([]),
          },
        },
      ],
    });
  });

  it('muestra únicamente la ficha enlazada y no el directorio nacional', async () => {
    const fixture = TestBed.createComponent(ReliefPointPage);
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await fixture.whenStable();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toContain(POINT.name);
    expect(page.textContent).toContain(POINT.addressReference);
    expect(page.textContent).toContain('Aceite de 250 ml');
    expect(page.textContent).toContain('Carpas');
    expect(page.textContent).toContain('Cantidades por confirmar');
    const buttons = [...page.querySelectorAll('button')].map((button) =>
      button.textContent?.trim(),
    );
    expect(buttons.some((label) => label?.includes('Compartir') || label?.includes('Share'))).toBe(
      true,
    );
    expect(page.querySelector('.back-link')?.getAttribute('href')).toBe('/inicio');
    expect(page.querySelector('.all-points-link')?.getAttribute('href')).toBe('/puntos');
    expect(page.querySelector('.department-list')).toBeNull();
  });
});
