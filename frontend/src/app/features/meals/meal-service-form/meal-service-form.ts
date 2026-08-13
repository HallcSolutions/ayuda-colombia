import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MEAL_TYPES, MealType } from '../../../core/constants/app.constants';
import { mealTypeKey } from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { ReliefPoint } from '../../../core/models/relief-point.model';
import { MealsService } from '../../../core/services/meals.service';
import { toIsoDate, toIsoTime } from '../../../core/utils/date.util';

@Component({
  selector: 'app-meal-service-form',
  imports: [ReactiveFormsModule],
  templateUrl: './meal-service-form.html',
  styleUrl: './meal-service-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealServiceForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly mealsService = inject(MealsService);
  private readonly i18n = inject(I18nService);

  readonly reliefPoint = input.required<ReliefPoint>();
  readonly closed = output<void>();

  protected readonly t = this.i18n.t;
  protected readonly mealTypes = MEAL_TYPES;
  protected readonly mealTypeKey = mealTypeKey;

  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    mealType: [MealType.LUNCH, Validators.required],
    servedOn: [toIsoDate(), Validators.required],
    startsAt: [toIsoTime(), Validators.required],
    portionsPlanned: [100, [Validators.required, Validators.min(1), Validators.max(50000)]],
    portionsDelivered: [0, [Validators.min(0), Validators.max(50000)]],
    notes: ['', Validators.maxLength(300)],
  });

  async submit(): Promise<void> {
    this.errorMessage.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorMessage.set(this.t('mealForm.invalid'));
      return;
    }

    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.mealsService.createMealService({
          ...this.form.getRawValue(),
          reliefPointId: this.reliefPoint().id,
        }),
      );
      this.closed.emit();
    } catch {
      this.errorMessage.set(this.t('mealForm.error'));
    } finally {
      this.submitting.set(false);
    }
  }
}
