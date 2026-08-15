import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  LodgingKind,
  LodgingStatus,
  ReliefPointStatus,
  ReliefPointType,
} from '../../../core/constants/app.constants';
import { I18nService } from '../../../core/i18n/i18n.service';
import { LodgingOffer } from '../../../core/models/lodging-offer.model';
import { ReliefPoint } from '../../../core/models/relief-point.model';
import { LodgingService } from '../../../core/services/lodging.service';
import { ReliefPointsService } from '../../../core/services/relief-points.service';
import { ReliefPointForm } from '../../relief-points/relief-point-form/relief-point-form';
import { LodgingSection } from './lodging-section';

/** Dobles: la sección solo lee signals; aquí no se habla con la API. */
const emptyList = () => ({
  loading: signal(false),
  error: signal(''),
});

const carePlace = (name: string, type: ReliefPointType): ReliefPoint => ({
  id: name,
  name,
  type,
  department: 'Antioquia',
  municipality: 'Medellín',
  latitude: 6.25,
  longitude: -75.56,
  addressReference: 'Calle 10 con carrera 40',
  contactName: 'Ana Ruiz',
  contactPhone: '3001234567',
  schedule: '8am a 6pm',
  dailyMealCapacity: null,
  status: ReliefPointStatus.ACTIVE,
  notes: '',
  verifiedBy: '',
  verifiedAt: null,
  createdAt: '2026-08-14T02:00:00.000Z',
  updatedAt: '2026-08-14T02:00:00.000Z',
});

const lodgingOffer = (placeName: string): LodgingOffer => ({
  id: placeName,
  placeName,
  kind: LodgingKind.HOTEL,
  hostName: 'Hotel solidario',
  contactPhone: '3001234567',
  department: 'Antioquia',
  municipality: 'Medellín',
  addressReference: 'Carrera 40 # 10-20',
  coordinates: { latitude: 6.24, longitude: -75.57 },
  totalSpaces: 10,
  occupiedSpaces: 2,
  availableSpaces: 8,
  maxNights: 3,
  freeOfCharge: true,
  acceptsPets: false,
  notes: '',
  verifiedBy: '',
  verifiedAt: null,
  status: LodgingStatus.AVAILABLE,
  createdAt: '2026-08-14T02:00:00.000Z',
  updatedAt: '2026-08-14T02:00:00.000Z',
});

const render = async (points: ReliefPoint[] = [], offers: LodgingOffer[] = []) => {
  TestBed.configureTestingModule({
    imports: [LodgingSection],
    providers: [
      provideHttpClient(),
      provideRouter([]),
      {
        provide: LodgingService,
        useValue: { ...emptyList(), offersInRegion: signal(offers), loadOffers: () => undefined },
      },
      {
        provide: ReliefPointsService,
        useValue: { ...emptyList(), pointsInRegion: signal(points), loadPoints: () => undefined },
      },
    ],
  });
  TestBed.inject(I18nService).setLocale('es');
  const fixture = TestBed.createComponent(LodgingSection);
  await fixture.whenStable();
  return fixture;
};

const click = async (fixture: Awaited<ReturnType<typeof render>>, selector: string, index = 0) => {
  const element = fixture.nativeElement as HTMLElement;
  (element.querySelectorAll(selector)[index] as HTMLButtonElement).click();
  await fixture.whenStable();
};

/** Los filtros son un solo renglón: se elige por su nombre, no por su posición. */
const clickPlace = async (fixture: Awaited<ReturnType<typeof render>>, label: string) => {
  const element = fixture.nativeElement as HTMLElement;
  const button = [...element.querySelectorAll<HTMLButtonElement>('.kind-tabs button')].find(
    (candidate) => candidate.textContent?.includes(label),
  );
  button?.click();
  await fixture.whenStable();
};

const placesText = (fixture: Awaited<ReturnType<typeof render>>) =>
  (fixture.nativeElement as HTMLElement).querySelector('.kind-tabs')?.textContent ?? '';

const registerLabel = (fixture: Awaited<ReturnType<typeof render>>) =>
  (fixture.nativeElement as HTMLElement).querySelector('.register')?.textContent?.trim();

const fixedType = (fixture: Awaited<ReturnType<typeof render>>) =>
  fixture.debugElement.query(By.directive(ReliefPointForm)).componentInstance.form.getRawValue()
    .type;

describe('LodgingSection', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('inicia con todos los lugares, sus listados y contadores generales', async () => {
    const fixture = await render(
      [
        carePlace('Albergue Coliseo Mayor', ReliefPointType.SHELTER),
        carePlace('Veterinaria del Valle', ReliefPointType.VETERINARY),
        carePlace('Puesto de salud La Ceiba', ReliefPointType.MEDICAL_POST),
      ],
      [lodgingOffer('Hotel solidario')],
    );
    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector<HTMLButtonElement>('.kind-tabs button.selected')?.textContent,
    ).toContain('Todos los lugares');
    expect(element.querySelectorAll('app-lodging-card').length).toBe(1);
    expect(element.querySelectorAll('app-care-place-card').length).toBe(3);
    expect(element.querySelector('.feature-hero__metrics')?.textContent).toContain(
      'Lugares registrados',
    );
    expect(element.querySelector('.feature-hero__metrics')?.textContent).toContain('Salud');
    expect(element.querySelector('.feature-hero__metrics')?.textContent).toContain('Veterinarias');
    expect(
      [...element.querySelectorAll('.feature-hero__metrics dd')].map((item) => item.textContent),
    ).toEqual(['4', '2', '1', '1']);
  });

  it('en Dormir se ofrece un cupo', async () => {
    const fixture = await render();

    await clickPlace(fixture, 'Todas las dormidas');
    expect(registerLabel(fixture)).toBe('Ofrecer alojamiento');

    await click(fixture, '.register');
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-lodging-form')).not.toBeNull();
    expect(element.querySelector('app-relief-point-form')).toBeNull();
  });

  it('muestra los albergues oficiales dentro de las dormidas', async () => {
    const fixture = await render([
      carePlace('Albergue Coliseo Mayor', ReliefPointType.SHELTER),
      carePlace('Acopio del barrio', ReliefPointType.COLLECTION_CENTER),
    ]);

    await clickPlace(fixture, 'Todas las dormidas');
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('app-care-place-card').length).toBe(1);
    expect(element.querySelector('.care-list')?.textContent).toContain('Albergue Coliseo Mayor');
    expect(element.querySelector('.care-list')?.textContent).not.toContain('Acopio del barrio');
  });

  /** Quien busca una veterinaria la encuentra en la misma fila donde filtra las dormidas. */
  it('ofrece salud y veterinarias junto a las clases de dormida', async () => {
    const fixture = await render();

    expect(placesText(fixture)).toContain('Casa de familia');
    expect(placesText(fixture)).toContain('Salud');
    expect(placesText(fixture)).toContain('Veterinarias');
  });

  it('en Salud se registra un puesto de salud, no un alojamiento', async () => {
    const fixture = await render();

    await clickPlace(fixture, 'Salud');
    expect(registerLabel(fixture)).toBe('Registrar sitio de salud');

    await click(fixture, '.register');
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-lodging-form')).toBeNull();
    expect(element.querySelector('.modal h3')?.textContent?.trim()).toBe(
      'Registrar un puesto de salud',
    );
    expect(fixedType(fixture)).toBe(ReliefPointType.MEDICAL_POST);
  });

  it('en Veterinarias se registra una veterinaria', async () => {
    const fixture = await render();

    await clickPlace(fixture, 'Veterinarias');
    expect(registerLabel(fixture)).toBe('Registrar veterinaria');

    await click(fixture, '.register');
    expect(fixedType(fixture)).toBe(ReliefPointType.VETERINARY);
  });

  /** El tipo ya está decidido por la pestaña: preguntarlo otra vez solo confunde. */
  it('no vuelve a preguntar el tipo de sitio', async () => {
    const fixture = await render();

    await clickPlace(fixture, 'Salud');
    await click(fixture, '.register');

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[formcontrolname="type"]'),
    ).toBeNull();
  });

  /** Lo que se registra tiene que salir después en la lista de su pestaña. */
  it('lista cada sitio en la pestaña que le corresponde', async () => {
    const fixture = await render([
      carePlace('Veterinaria del Valle', ReliefPointType.VETERINARY),
      carePlace('Puesto de salud La Ceiba', ReliefPointType.MEDICAL_POST),
      carePlace('Acopio del barrio', ReliefPointType.COLLECTION_CENTER),
    ]);
    const element = fixture.nativeElement as HTMLElement;

    await clickPlace(fixture, 'Salud');
    expect(element.querySelectorAll('app-care-place-card').length).toBe(1);
    expect(element.querySelector('.care-list')?.textContent).toContain('Puesto de salud La Ceiba');

    await clickPlace(fixture, 'Veterinarias');
    expect(element.querySelectorAll('app-care-place-card').length).toBe(1);
    expect(element.querySelector('.care-list')?.textContent).toContain('Veterinaria del Valle');
  });

  it('cambiar de pestaña cierra el formulario abierto', async () => {
    const fixture = await render();

    await clickPlace(fixture, 'Todas las dormidas');
    await click(fixture, '.register');
    await clickPlace(fixture, 'Veterinarias');

    expect((fixture.nativeElement as HTMLElement).querySelector('.modal')).toBeNull();
  });
});
