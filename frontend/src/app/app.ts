import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavTab } from './app.model';
import { I18nService } from './core/i18n/i18n.service';
import { AlertsService } from './core/services/alerts.service';
import { RegionService } from './core/services/region.service';
import { ReportsService } from './core/services/reports.service';
import { AlertBanner } from './features/alerts/alert-banner/alert-banner';
import { LanguageSwitcher } from './shared/language-switcher/language-switcher';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AlertBanner, LanguageSwitcher],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly region = inject(RegionService);
  private readonly reportsService = inject(ReportsService);
  private readonly alertsService = inject(AlertsService);
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
    { path: '/reportar', labelKey: 'nav.report' },
    { path: '/reportes', labelKey: 'nav.needs' },
  ];

  constructor() {
    // Cambiar de departamento o ciudad recarga los reportes de esa zona.
    // Las alertas y los puntos los recargan sus propias secciones.
    effect(() => {
      this.region.selection();
      this.reportsService.loadReports();
    });
  }
}
