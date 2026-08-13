import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { AlertNotificationsService } from '../../../core/services/alert-notifications.service';
import { AlertsService } from '../../../core/services/alerts.service';
import { RegionService } from '../../../core/services/region.service';

@Component({
  selector: 'app-alert-banner',
  templateUrl: './alert-banner.html',
  styleUrl: './alert-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertBanner {
  private readonly alertsService = inject(AlertsService);
  private readonly region = inject(RegionService);
  readonly notifications = inject(AlertNotificationsService);
  readonly i18n = inject(I18nService);

  protected readonly t = this.i18n.t;

  readonly alerts = this.alertsService.activeAlerts;
  readonly departmentCount = computed(
    () => new Set(this.alerts().map((alert) => alert.reliefPoint.department)).size,
  );

  constructor() {
    effect(() => {
      this.region.selection();
      this.alertsService.loadAlerts();
    });
  }
}
