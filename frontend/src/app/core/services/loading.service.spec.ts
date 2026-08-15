import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  afterEach(() => vi.useRealTimers());

  /** Deja la aplicación como después de un arranque completo. */
  const finishBoot = (): void => {
    service.markFirstViewPainted();
    vi.advanceTimersByTime(600);
  };

  it('mantiene la portada hasta que la primera pantalla tiene sus datos', () => {
    service.begin();
    service.markFirstViewPainted();
    vi.advanceTimersByTime(600);

    expect(service.booting()).toBe(true);
    expect(service.visible()).toBe(false);

    service.end();
    vi.advanceTimersByTime(600);

    expect(service.booting()).toBe(false);
  });

  it('sigue esperando si la pantalla encadena otra petición', () => {
    service.begin();
    service.markFirstViewPainted();
    service.end();

    // Una segunda petición arranca antes de que termine el rato de silencio.
    vi.advanceTimersByTime(100);
    service.begin();
    vi.advanceTimersByTime(600);
    expect(service.booting()).toBe(true);

    service.end();
    vi.advanceTimersByTime(600);
    expect(service.booting()).toBe(false);
  });

  it('retira la portada aunque el servidor no conteste nunca', () => {
    service.begin();
    service.markFirstViewPainted();
    vi.advanceTimersByTime(12_000);

    expect(service.booting()).toBe(false);
  });

  it('retira la portada aunque la primera pantalla nunca llegue a pintarse', () => {
    vi.advanceTimersByTime(12_000);

    expect(service.booting()).toBe(false);
  });

  it('no parpadea cuando una petición posterior responde rápido', () => {
    finishBoot();

    service.begin();
    vi.advanceTimersByTime(100);
    service.end();
    vi.advanceTimersByTime(600);

    expect(service.visible()).toBe(false);
  });

  it('espera todas las peticiones simultáneas antes de ocultar la línea', () => {
    finishBoot();

    service.begin();
    service.begin();
    vi.advanceTimersByTime(200);
    expect(service.visible()).toBe(true);

    service.end();
    vi.advanceTimersByTime(700);
    expect(service.visible()).toBe(true);

    service.end();
    vi.advanceTimersByTime(600);
    expect(service.visible()).toBe(false);
  });
});
