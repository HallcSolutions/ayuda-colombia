import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  SUPPLY_CATEGORIES,
  SupplyCategory,
  URGENCY_LEVELS,
  UrgencyLevel,
} from '../../../core/constants/app.constants';
import { supplyCategoryKey, urgencyKey } from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { ReliefPoint } from '../../../core/models/relief-point.model';
import { AlertsService } from '../../../core/services/alerts.service';
import { ReporterCodeField } from '../../../shared/reporter-code-field/reporter-code-field';

@Component({
  selector: 'app-alert-form',
  imports: [ReactiveFormsModule, ReporterCodeField],
  templateUrl: './alert-form.html',
  styleUrl: './alert-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly alertsService = inject(AlertsService);
  private readonly i18n = inject(I18nService);

  readonly reliefPoint = input.required<ReliefPoint>();
  readonly closed = output<void>();

  protected readonly t = this.i18n.t;
  protected readonly categories = SUPPLY_CATEGORIES;
  protected readonly urgencies = URGENCY_LEVELS;
  protected readonly categoryKey = supplyCategoryKey;
  protected readonly urgencyKey = urgencyKey;

  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    category: [SupplyCategory.FOOD, Validators.required],
    severity: [UrgencyLevel.HIGH, Validators.required],
    title: ['', [Validators.required, Validators.maxLength(120)]],
    message: ['', [Validators.required, Validators.maxLength(500)]],
    requestedQuantity: ['', Validators.maxLength(60)],
    createdBy: ['', [Validators.required, Validators.maxLength(80)]],
  });

  async submit(): Promise<void> {
    this.errorMessage.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorMessage.set(this.t('alertForm.invalid'));
      return;
    }

    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.alertsService.createAlert({
          ...this.form.getRawValue(),
          reliefPointId: this.reliefPoint().id,
        }),
      );
      this.closed.emit();
    } catch {
      this.errorMessage.set(this.t('alertForm.error'));
    } finally {
      this.submitting.set(false);
    }
  }
}
