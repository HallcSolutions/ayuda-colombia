import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { I18nService } from './core/i18n/i18n.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  const tabLabels = (): string[] => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    return [...compiled.querySelectorAll('.nav-tabs a')].map(
      (tab) => tab.textContent?.trim() ?? '',
    );
  };

  it('should create the app', () => {
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });

  it('should render one nav tab per route', () => {
    TestBed.inject(I18nService).setLocale('es');

    expect(tabLabels()).toEqual([
      'Inicio',
      'Puntos de ayuda',
      'A dónde ir',
      'Camiones',
      'Desaparecidos',
      'Noticias',
      'Recuperación',
      'Registrar familia',
      'Ayuda directa',
    ]);
  });

  it('should translate the nav tabs when the locale changes', () => {
    TestBed.inject(I18nService).setLocale('en');

    expect(tabLabels()).toEqual([
      'Home',
      'Aid points',
      'Where to go',
      'Trucks',
      'Missing',
      'News',
      'Recovery',
      'Register a family',
      'Direct aid',
    ]);
  });
});
