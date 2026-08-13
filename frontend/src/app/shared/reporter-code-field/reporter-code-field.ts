import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReporterAccessService } from '../../core/services/reporter-access.service';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-reporter-code-field',
  templateUrl: './reporter-code-field.html',
  styleUrl: './reporter-code-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporterCodeField {
  readonly access = inject(ReporterAccessService);
  readonly t = inject(I18nService).t;

  updateCode(event: Event): void {
    this.access.setCode((event.target as HTMLInputElement).value);
  }
}
