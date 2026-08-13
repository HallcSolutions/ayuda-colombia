import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { LodgingStatus } from '../../../core/constants/app.constants';
import {
  LODGING_KIND_ICONS,
  lodgingKindKey,
  lodgingStatusKey,
} from '../../../core/i18n/domain-keys';
import { TranslationKey } from '../../../core/i18n/es.translations';
import { I18nService } from '../../../core/i18n/i18n.service';
import { LodgingOffer } from '../../../core/models/lodging-offer.model';
import { LodgingService } from '../../../core/services/lodging.service';
import { mapUrl } from '../../../core/utils/geo.util';
import { whatsappUrl } from '../../../core/utils/phone.util';

/** Lo que espera confirmación con el PIN: mover cupos o cerrar/reabrir el ofrecimiento. */
type PendingAction = { type: 'occupancy' } | { type: 'status'; status: LodgingStatus };

@Component({
  selector: 'app-lodging-card',
  templateUrl: './lodging-card.html',
  styleUrl: './lodging-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LodgingCard {
  private readonly lodgingService = inject(LodgingService);

  readonly offer = input.required<LodgingOffer>();

  protected readonly t = inject(I18nService).t;
  protected readonly kindKey = lodgingKindKey;
  protected readonly statusKey = lodgingStatusKey;
  protected readonly kindIcons = LODGING_KIND_ICONS;
  protected readonly lodgingStatus = LodgingStatus;

  // El mensaje se guarda como clave para que cambiar de idioma lo repinte traducido.
  private readonly errorKey = signal<TranslationKey | null>(null);
  readonly errorMessage = computed(() => {
    const key = this.errorKey();
    return key ? this.t(key) : '';
  });

  readonly pendingAction = signal<PendingAction | null>(null);
  readonly spaces = signal(1);
  readonly pin = signal('');
  readonly saving = signal(false);

  /** Cuánto del alojamiento está ya ocupado, para pintar la barra de cupos. */
  readonly occupancyPercent = computed(() => {
    const offer = this.offer();
    return offer.totalSpaces ? Math.round((offer.occupiedSpaces / offer.totalSpaces) * 100) : 100;
  });

  readonly mapLink = computed(() => {
    const coordinates = this.offer().coordinates;
    return coordinates ? mapUrl(coordinates) : '';
  });

  readonly whatsappLink = computed(() => whatsappUrl(this.offer().contactPhone));

  /** Pide el PIN antes de tocar los cupos: no es una acción de un solo clic. */
  openOccupancyPanel(): void {
    this.reset();
    this.spaces.set(1);
    this.pendingAction.set({ type: 'occupancy' });
  }

  askForStatus(status: LodgingStatus): void {
    this.reset();
    this.pendingAction.set({ type: 'status', status });
  }

  cancel(): void {
    this.pendingAction.set(null);
    this.pin.set('');
  }

  updateSpaces(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.spaces.set(Number.isFinite(value) && value > 0 ? Math.floor(value) : 1);
  }

  updatePin(event: Event): void {
    this.pin.set((event.target as HTMLInputElement).value.trim());
  }

  /** `direction` vale 1 cuando llega gente a dormir y -1 cuando el cupo se libera. */
  applyOccupancy(direction: 1 | -1): Promise<void> {
    return this.confirm(
      this.lodgingService.changeOccupancy(this.offer().id, direction * this.spaces(), this.pin()),
    );
  }

  confirmStatus(): Promise<void> {
    const action = this.pendingAction();
    if (action?.type !== 'status') return Promise.resolve();
    return this.confirm(
      this.lodgingService.changeStatus(this.offer().id, action.status, this.pin()),
    );
  }

  private async confirm(request: Observable<LodgingOffer>): Promise<void> {
    this.errorKey.set(null);
    this.saving.set(true);
    try {
      await firstValueFrom(request);
      this.cancel();
    } catch (error) {
      this.errorKey.set(
        error instanceof HttpErrorResponse && error.status === 401
          ? 'lodgingCard.pinWrong'
          : 'lodgingCard.updateError',
      );
    } finally {
      this.saving.set(false);
    }
  }

  private reset(): void {
    this.errorKey.set(null);
    this.pin.set('');
  }
}
