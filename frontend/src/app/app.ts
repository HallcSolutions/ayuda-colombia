import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavTab } from './app.model';
import { I18nService } from './core/i18n/i18n.service';
import { AlertsService } from './core/services/alerts.service';
import { LoadingService } from './core/services/loading.service';
import { RegionService } from './core/services/region.service';
import { ReportsService } from './core/services/reports.service';
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
    { path: '/recuperacion', labelKey: 'nav.recovery' },
    { path: '/reportar', labelKey: 'nav.report' },
    { path: '/reportes', labelKey: 'nav.needs' },
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
    // La portada permanece hasta que Angular haya pintado y las peticiones iniciales terminen.
    afterNextRender(() => this.loading.releaseInitial());

    // Cambiar de departamento o ciudad recarga los reportes de esa zona.
    // Las alertas y los puntos los recargan sus propias secciones.
    effect(() => {
      this.region.selection();
      this.reportsService.loadReports();
    });
  }
}
