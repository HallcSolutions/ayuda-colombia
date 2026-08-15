import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TranslationKey } from '../../../core/i18n/es.translations';
import { I18nService } from '../../../core/i18n/i18n.service';
import { RecoveryService } from '../../../core/services/recovery.service';
import { EMAIL_PATTERN } from '../../../core/utils/email.util';

/**
 * Salida para quien perdió su código o su PIN. El PIN se guarda cifrado, así que no
 * se puede reenviar el mismo: llega uno nuevo al correo con el que se publicó.
 */
@Component({
  selector: 'app-recovery-access-recovery',
  templateUrl: './recovery-access-recovery.html',
  styleUrl: './recovery-access-recovery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoveryAccessRecovery {
  private readonly recovery = inject(RecoveryService);
  protected readonly t = inject(I18nService).t;

  readonly open = signal(false);
  readonly email = signal('');
  readonly sending = signal(false);
  readonly noticeKey = signal<TranslationKey | null>(null);
  readonly failed = signal(false);

  toggle(): void {
    this.open.update((open) => !open);
  }

  updateEmail(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value.trim());
  }

  async request(): Promise<void> {
    if (!EMAIL_PATTERN.test(this.email())) {
      this.failed.set(true);
      this.noticeKey.set('recovery.access.invalidEmail');
      return;
    }
    this.sending.set(true);
    this.noticeKey.set(null);
    try {
      await firstValueFrom(this.recovery.recoverAccess(this.email()));
      this.failed.set(false);
      this.noticeKey.set('recovery.access.sent');
    } catch (error) {
      this.failed.set(true);
      this.noticeKey.set(
        error instanceof HttpErrorResponse && error.status === 503
          ? 'recovery.access.unavailable'
          : 'recovery.access.error',
      );
    } finally {
      this.sending.set(false);
    }
  }
}
