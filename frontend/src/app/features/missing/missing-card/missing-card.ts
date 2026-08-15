import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MissingStatus } from '../../../core/constants/app.constants';
import {
  MISSING_KIND_ICONS,
  missingKindKey,
  missingStatusKey,
} from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { MissingRecord } from '../../../core/models/missing-record.model';
import { MissingService } from '../../../core/services/missing.service';
import { colombiaDate, colombiaDateTime } from '../../../core/utils/date.util';
import { mapUrl } from '../../../core/utils/geo.util';
import { whatsappUrl } from '../../../core/utils/phone.util';

@Component({
  selector: 'app-missing-card',
  templateUrl: './missing-card.html',
  styleUrl: './missing-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissingCard {
  private readonly missingService = inject(MissingService);
  private readonly i18n = inject(I18nService);

  readonly record = input.required<MissingRecord>();

  protected readonly t = this.i18n.t;
  protected readonly kindKey = missingKindKey;
  protected readonly statusKey = missingStatusKey;
  protected readonly kindIcons = MISSING_KIND_ICONS;
  protected readonly missingStatus = MissingStatus;

  readonly errorMessage = signal('');
  /** Estado que se aplicará en cuanto se confirme el PIN. */
  readonly pendingStatus = signal<MissingStatus | null>(null);
  readonly pin = signal('');
  readonly saving = signal(false);

  readonly lastSeenLabel = computed(() => this.formatDate(this.record().lastSeenAt));
  readonly foundLabel = computed(() => {
    const foundAt = this.record().foundAt;
    return foundAt ? this.formatDate(foundAt) : '';
  });
  readonly sourceVerifiedLabel = computed(() => {
    const checkedAt = this.record().sourceVerifiedAt;
    return checkedAt ? colombiaDate(checkedAt, this.i18n.locale()) : '';
  });
  readonly reportedDateLabel = computed(() =>
    this.record().sourceUrl
      ? colombiaDate(this.record().lastSeenAt, this.i18n.locale())
      : this.lastSeenLabel(),
  );

  readonly mapLink = computed(() => {
    const coordinates = this.record().coordinates;
    return coordinates ? mapUrl(coordinates) : '';
  });

  readonly whatsappLink = computed(() => whatsappUrl(this.record().contactPhone));

  /** Pide el PIN antes de tocar el aviso: cambiarlo no es una acción de un solo clic. */
  askForPin(status: MissingStatus): void {
    this.errorMessage.set('');
    this.pin.set('');
    this.pendingStatus.set(status);
  }

  cancelPinPrompt(): void {
    this.pendingStatus.set(null);
    this.pin.set('');
  }

  updatePin(event: Event): void {
    this.pin.set((event.target as HTMLInputElement).value.trim());
  }

  async confirmStatusChange(): Promise<void> {
    const status = this.pendingStatus();
    if (!status) return;
    this.errorMessage.set('');
    this.saving.set(true);
    try {
      await firstValueFrom(this.missingService.changeStatus(this.record().id, status, this.pin()));
      this.cancelPinPrompt();
    } catch (error) {
      this.errorMessage.set(
        error instanceof HttpErrorResponse && error.status === 401
          ? this.t('missingCard.pinWrong')
          : this.t('missing.statusError'),
      );
    } finally {
      this.saving.set(false);
    }
  }

  private formatDate(value: string): string {
    return colombiaDateTime(value, this.i18n.locale());
  }
}
