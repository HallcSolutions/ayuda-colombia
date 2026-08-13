import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ReliefPointStatus } from '../../../core/constants/app.constants';
import {
  mealTypeKey,
  reliefPointStatusKey,
  reliefPointTypeKey,
  supplyCategoryKey,
} from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { AidAlert } from '../../../core/models/aid-alert.model';
import { MealService } from '../../../core/models/meal-service.model';
import { ReliefPoint } from '../../../core/models/relief-point.model';
import { ReliefPointsService } from '../../../core/services/relief-points.service';
import { mapUrl } from '../../../core/utils/geo.util';

@Component({
  selector: 'app-relief-point-card',
  templateUrl: './relief-point-card.html',
  styleUrl: './relief-point-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReliefPointCard {
  private readonly reliefPointsService = inject(ReliefPointsService);
  private readonly i18n = inject(I18nService);

  readonly point = input.required<ReliefPoint>();
  readonly meals = input<MealService[]>([]);
  readonly alerts = input<AidAlert[]>([]);
  readonly distanceKm = input<number | null>(null);
  readonly requestHelp = output<ReliefPoint>();
  readonly registerMeal = output<ReliefPoint>();

  protected readonly t = this.i18n.t;
  protected readonly typeKey = reliefPointTypeKey;
  protected readonly statusKey = reliefPointStatusKey;
  protected readonly mealTypeKey = mealTypeKey;
  protected readonly categoryKey = supplyCategoryKey;
  protected readonly pointStatus = ReliefPointStatus;

  readonly errorMessage = signal('');

  get mapLink(): string {
    return mapUrl(this.point());
  }

  async changeStatus(status: ReliefPointStatus): Promise<void> {
    this.errorMessage.set('');
    try {
      await firstValueFrom(this.reliefPointsService.changeStatus(this.point().id, status));
    } catch {
      this.errorMessage.set(this.t('reliefPointCard.statusError'));
    }
  }
}
