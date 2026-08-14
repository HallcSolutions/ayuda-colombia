import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { reliefPointStatusKey, reliefPointTypeKey } from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { ReliefPoint } from '../../../core/models/relief-point.model';
import { mapUrl } from '../../../core/utils/geo.util';

/**
 * Un sitio al que se va a ser atendido: puesto de salud o veterinaria. Enseña la
 * dirección, cómo llegar y quién comprobó el lugar, porque mandar a alguien de
 * noche a una dirección que nadie ha confirmado es exactamente lo que hay que evitar.
 */
@Component({
  selector: 'app-care-place-card',
  imports: [DatePipe],
  templateUrl: './care-place-card.html',
  styleUrl: './care-place-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarePlaceCard {
  protected readonly i18n = inject(I18nService);

  readonly place = input.required<ReliefPoint>();

  protected readonly t = this.i18n.t;
  protected readonly typeKey = reliefPointTypeKey;
  protected readonly statusKey = reliefPointStatusKey;

  readonly directionsUrl = computed(() => mapUrl(this.place()));

  readonly hasCallablePhone = computed(
    () => (this.place().contactPhone.match(/\d/g)?.length ?? 0) >= 7,
  );
}
