import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, take } from 'rxjs';
import { NavTab } from './app.model';
import { ReportStatus } from './core/constants/app.constants';
import { I18nService } from './core/i18n/i18n.service';
import { AlertsService } from './core/services/alerts.service';
import { LoadingService } from './core/services/loading.service';
import { RegionService } from './core/services/region.service';
import { ReportsService } from './core/services/reports.service';
import { hideBootCover } from './core/utils/boot-cover.util';
import { AlertBanner } from './features/alerts/alert-banner/alert-banner';
import { LanguageSwitcher } from './shared/language-switcher/language-switcher';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AlertBanner, LanguageSwitcher],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeMenu()' },
})
export class App {
  private readonly region = inject(RegionService);
  private readonly reportsService = inject(ReportsService);
  private readonly alertsService = inject(AlertsService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  readonly loading = inject(LoadingService);
  readonly t = inject(I18nService).t;

  readonly tabs: NavTab[] = [
    { path: '/inicio', labelKey: 'nav.home' },
    {
      path: '/puntos',
      labelKey: 'nav.points',
      badge: computed(() => this.alertsService.activeAlerts().length),
    },
    { path: '/alojamientos', labelKey: 'nav.lodging' },
    { path: '/camiones', labelKey: 'nav.convoys' },
    { path: '/desaparecidos', labelKey: 'nav.missing' },
    { path: '/noticias', labelKey: 'nav.news' },
    { path: '/recuperacion', labelKey: 'nav.recovery' },
    { path: '/reportar', labelKey: 'nav.report' },
    {
      path: '/reportes',
      labelKey: 'nav.needs',
      // Familias de la zona que siguen esperando: es la cifra que hace entrar a la pestaña.
      badge: computed(
        () =>
          this.reportsService
            .reportsInRegion()
            .filter((report) => report.status === ReportStatus.OPEN).length,
      ),
    },
  ];

  /**
   * En el teléfono las pestañas no caben en la barra, así que se despliegan desde el
   * botón de menú. En pantalla ancha se ven siempre y este estado no pinta nada.
   */
  readonly menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  constructor() {
    // La portada aguanta hasta que la primera ruta está pintada: si se fuera antes,
    // se vería el encabezado pegado al pie y todo saltaría al llegar el contenido.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        take(1),
        takeUntilDestroyed(),
      )
      .subscribe(() =>
        afterNextRender(() => this.loading.markFirstViewPainted(), { injector: this.injector }),
      );

    // Retirarla es cosa de la aplicación, no del arranque: solo cuando ya no falta nada.
    effect(() => {
      if (!this.loading.booting()) {
        hideBootCover();
      }
    });

    // Cambiar de departamento o ciudad recarga los reportes de esa zona.
    // Las alertas y los puntos los recargan sus propias secciones.
    effect(() => {
      this.region.selection();
      this.reportsService.loadReports();
    });
  }
}
