import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { TranslationKey } from '../../core/i18n/es.translations';
import { I18nService } from '../../core/i18n/i18n.service';

/**
 * Entrega del código y el PIN que solo se muestran una vez: rótulo, los dos datos
 * separados por una línea fina y las dos acciones.
 */
@Component({
  selector: 'app-access-result',
  templateUrl: './access-result.html',
  styleUrl: './access-result.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessResult {
  readonly status = input.required<TranslationKey>();
  readonly title = input.required<TranslationKey>();
  readonly codeLabel = input.required<TranslationKey>();
  readonly code = input.required<string>();
  readonly pin = input.required<string>();
  readonly note = input.required<TranslationKey>();
  readonly closed = output<void>();

  protected readonly t = inject(I18nService).t;
  protected readonly copied = signal(false);

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(
        `${this.t(this.codeLabel())}: ${this.code()}\nPIN: ${this.pin()}`,
      );
      this.copied.set(true);
    } catch {
      // Ambos valores siguen en pantalla para copiarlos a mano.
    }
  }
}
