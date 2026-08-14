import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReliefPointType } from '../../../core/constants/app.constants';
import { I18nService } from '../../../core/i18n/i18n.service';
import { LodgingService } from '../../../core/services/lodging.service';
import { ReliefPointsService } from '../../../core/services/relief-points.service';
import { ReliefPointForm } from '../../relief-points/relief-point-form/relief-point-form';
import { LodgingSection } from './lodging-section';

/** Dobles: la sección solo lee signals; aquí no se habla con la API. */
const emptyList = () => ({
  loading: signal(false),
  error: signal(''),
});

const render = async () => {
  TestBed.configureTestingModule({
    imports: [LodgingSection],
    providers: [
      provideHttpClient(),
      provideRouter([]),
      {
        provide: LodgingService,
        useValue: { ...emptyList(), offersInRegion: signal([]), loadOffers: () => undefined },
      },
      {
        provide: ReliefPointsService,
        useValue: { ...emptyList(), pointsInRegion: signal([]), loadPoints: () => undefined },
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

const registerLabel = (fixture: Awaited<ReturnType<typeof render>>) =>
  (fixture.nativeElement as HTMLElement).querySelector('.register')?.textContent?.trim();

const fixedType = (fixture: Awaited<ReturnType<typeof render>>) =>
  fixture.debugElement.query(By.directive(ReliefPointForm)).componentInstance.form.getRawValue()
    .type;

describe('LodgingSection', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('en Dormir se ofrece un cupo', async () => {
    const fixture = await render();

    expect(registerLabel(fixture)).toBe('Ofrecer alojamiento');

    await click(fixture, '.register');
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-lodging-form')).not.toBeNull();
    expect(element.querySelector('app-relief-point-form')).toBeNull();
  });

  it('en Salud se registra un puesto de salud, no un alojamiento', async () => {
    const fixture = await render();

    await click(fixture, '.group-tabs button', 1);
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

    await click(fixture, '.group-tabs button', 2);
    expect(registerLabel(fixture)).toBe('Registrar veterinaria');

    await click(fixture, '.register');
    expect(fixedType(fixture)).toBe(ReliefPointType.VETERINARY);
  });

  /** El tipo ya está decidido por la pestaña: preguntarlo otra vez solo confunde. */
  it('no vuelve a preguntar el tipo de sitio', async () => {
    const fixture = await render();

    await click(fixture, '.group-tabs button', 1);
    await click(fixture, '.register');

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[formcontrolname="type"]'),
    ).toBeNull();
  });

  it('cambiar de pestaña cierra el formulario abierto', async () => {
    const fixture = await render();

    await click(fixture, '.register');
    await click(fixture, '.group-tabs button', 2);

    expect((fixture.nativeElement as HTMLElement).querySelector('.modal')).toBeNull();
  });
});
