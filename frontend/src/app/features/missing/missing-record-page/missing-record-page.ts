import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { missingKindKey } from '../../../core/i18n/domain-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { MissingRecord } from '../../../core/models/missing-record.model';
import { MissingService } from '../../../core/services/missing.service';
import { MissingCard } from '../missing-card/missing-card';

@Component({
  selector: 'app-missing-record-page',
  imports: [RouterLink, MissingCard],
  templateUrl: './missing-record-page.html',
  styleUrl: './missing-record-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissingRecordPage {
  private readonly route = inject(ActivatedRoute);
  private readonly missingService = inject(MissingService);

  protected readonly t = inject(I18nService).t;
  protected readonly kindKey = missingKindKey;

  readonly recordId = this.route.snapshot.paramMap.get('missingId') ?? '';
  readonly loadedRecord = signal<MissingRecord | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly record = computed(
    () =>
      this.missingService.records().find((record) => record.id === this.recordId) ??
      this.loadedRecord(),
  );

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    if (!this.recordId) {
      this.loadError.set(this.t('missingPage.notFound'));
      this.loading.set(false);
      return;
    }

    try {
      this.loadedRecord.set(await firstValueFrom(this.missingService.loadRecord(this.recordId)));
    } catch {
      this.loadError.set(this.t('missingPage.notFound'));
    } finally {
      this.loading.set(false);
    }
  }
}
