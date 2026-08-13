import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { ConvoyTrackerService } from '../../../core/services/convoy-tracker.service';

/**
 * El panel de quien conduce: solo aparece en el dispositivo que anunció el viaje, y es
 * desde donde se enciende, se apaga y se cierra el rastreo. Nadie más puede tocarlo.
 */
@Component({
  selector: 'app-convoy-tracker',
  templateUrl: './convoy-tracker.html',
  styleUrl: './convoy-tracker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConvoyTracker {
  readonly tracker = inject(ConvoyTrackerService);

  protected readonly t = inject(I18nService).t;

  readonly title = computed(() =>
    this.tracker.sharing()
      ? this.t('convoyTracker.sharingTitle')
      : this.t('convoyTracker.pausedTitle'),
  );

  readonly body = computed(() => {
    const trip = this.tracker.trip();
    if (!trip) return '';
    return this.t('convoyTracker.body', {
      destination: trip.destination.name,
      status: this.tracker.sharing()
        ? this.t('convoyTracker.sharingBody')
        : this.t('convoyTracker.pausedBody'),
    });
  });
}
