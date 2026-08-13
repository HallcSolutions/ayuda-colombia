import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, inject, input, output } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';

/**
 * Ventana que se abre sobre la página para un formulario: título, botón de cerrar y el
 * contenido proyectado. Se cierra tocando fuera, con la × o con Escape.
 */
@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
})
export class Modal implements OnDestroy {
  readonly title = input.required<string>();
  /** Línea corta sobre el título; vacía si no hace falta. */
  readonly eyebrow = input('');
  readonly closed = output<void>();

  protected readonly t = inject(I18nService).t;

  private readonly document = inject(DOCUMENT);
  /** Quien abrió la ventana recupera el foco al cerrarse. */
  private readonly trigger =
    this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
  private readonly previousOverflow = this.document.body.style.overflow;

  constructor() {
    // Mientras la ventana está abierta, lo de detrás no se desplaza.
    this.document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = this.previousOverflow;
    const trigger = this.trigger;
    setTimeout(() => trigger?.focus());
  }
}
