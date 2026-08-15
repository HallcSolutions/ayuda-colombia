import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RecoveryApplicationStatus } from '../../../core/constants/app.constants';
import { recoveryApplicationStatusKey } from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { RecoveryApplication, RecoveryHelperProfile } from '../../../core/models/recovery.model';
import { RecoveryService } from '../../../core/services/recovery.service';
import { RecoveryAccessRecovery } from '../recovery-access-recovery/recovery-access-recovery';

@Component({
  selector: 'app-recovery-helper-manage-panel',
  imports: [RecoveryAccessRecovery],
  templateUrl: './recovery-helper-manage-panel.html',
  styleUrl: './recovery-helper-manage-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoveryHelperManagePanel {
  private readonly recovery = inject(RecoveryService);
  protected readonly t = inject(I18nService).t;
  protected readonly statuses = RecoveryApplicationStatus;
  protected readonly applicationStatusKey = recoveryApplicationStatusKey;

  readonly helperId = signal(this.recovery.helperId());
  readonly pin = signal('');
  readonly profile = signal<RecoveryHelperProfile | null>(null);
  readonly applications = signal<RecoveryApplication[]>([]);
  readonly authenticated = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');

  updateHelperId(event: Event): void {
    this.helperId.set((event.target as HTMLInputElement).value.trim());
  }

  updatePin(event: Event): void {
    this.pin.set((event.target as HTMLInputElement).value.trim());
  }

  async load(): Promise<void> {
    if (!this.helperId() || !/^\d{6}$/.test(this.pin())) {
      this.error.set(this.t('recovery.helperManage.badPin'));
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      const [profile, applications] = await Promise.all([
        firstValueFrom(this.recovery.getHelper(this.helperId(), this.pin())),
        firstValueFrom(this.recovery.getHelperApplications(this.helperId(), this.pin())),
      ]);
      this.profile.set(profile);
      this.applications.set(applications);
      this.authenticated.set(true);
    } catch {
      this.error.set(this.t('recovery.helperManage.badPin'));
    } finally {
      this.loading.set(false);
    }
  }

  async withdraw(application: RecoveryApplication): Promise<void> {
    this.error.set('');
    try {
      const updated = await firstValueFrom(
        this.recovery.withdrawApplication(application.id, this.pin()),
      );
      this.applications.update((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch {
      this.error.set(this.t('recovery.helperManage.actionError'));
    }
  }
}
