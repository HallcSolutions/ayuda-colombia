import { Directive, ElementRef, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { PHONE_MAX_LENGTH, sanitizePhone } from '../../core/utils/phone.util';

/**
 * Campo de teléfono: un número al que hay que poder llamar de madrugada.
 *
 * Las letras se borran mientras se escribe, en vez de dejar que alguien publique
 * un contacto imposible y solo se entere al pulsar enviar. También abre el teclado
 * numérico del teléfono, que es desde donde se llena este formulario.
 */
@Directive({
  selector: 'input[appPhoneField]',
  host: {
    type: 'tel',
    inputmode: 'tel',
    autocomplete: 'tel',
    '[attr.maxlength]': 'maxLength',
    '(input)': 'removeLetters()',
  },
})
export class PhoneFieldDirective {
  protected readonly maxLength = PHONE_MAX_LENGTH;

  private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  protected removeLetters(): void {
    const typed = this.input.value;
    const clean = sanitizePhone(typed);
    if (clean === typed) return;

    // El cursor se queda donde estaba menos lo que se acaba de descartar: si no,
    // salta al final y escribir en medio del número se vuelve imposible.
    const discarded = typed.length - clean.length;
    const caret = Math.max(0, (this.input.selectionStart ?? typed.length) - discarded);
    this.ngControl?.control?.setValue(clean);
    this.input.value = clean;
    this.input.setSelectionRange(caret, caret);
  }
}
