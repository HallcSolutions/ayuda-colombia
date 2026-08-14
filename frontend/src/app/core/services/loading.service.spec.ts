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

  it('mantiene la portada hasta terminar la carga inicial', () => {
    service.begin();
    service.releaseInitial();
    vi.advanceTimersByTime(600);

    expect(service.visible()).toBe(true);
    expect(service.isInitial()).toBe(true);

    service.end();
    vi.advanceTimersByTime(600);

    expect(service.visible()).toBe(false);
    expect(service.isInitial()).toBe(false);
  });

  it('no parpadea cuando una petición posterior responde rápido', () => {
    service.releaseInitial();
    vi.advanceTimersByTime(600);
    expect(service.visible()).toBe(false);

    service.begin();
    vi.advanceTimersByTime(100);
    service.end();
    vi.advanceTimersByTime(600);

    expect(service.visible()).toBe(false);
  });

  it('espera todas las peticiones simultáneas antes de ocultarse', () => {
    service.releaseInitial();
    vi.advanceTimersByTime(600);

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
