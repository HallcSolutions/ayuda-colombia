import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import { HouseReport } from '../models/house-report.model';
import { MissingRecord } from '../models/missing-record.model';

export type PublicRecordShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Enlaces estables para que compartir abra una sola ficha y no un listado filtrado. */
@Injectable({ providedIn: 'root' })
export class PublicRecordShareService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly i18n = inject(I18nService);

  missingPathFor(record: MissingRecord): string {
    const slug = this.slug([record.name, record.municipality]);
    return `/desaparecidos/${slug}/${encodeURIComponent(record.id)}`;
  }

  reportPathFor(report: HouseReport): string {
    const slug = this.slug(['ayuda', report.municipality, report.addressReference]);
    return `/reportes/${slug}/${encodeURIComponent(report.id)}`;
  }

  aidOfferPath(): string {
    return '/inicio#ayuda-disponible-cali';
  }

  missingUrlFor(record: MissingRecord): string {
    return this.urlFor(this.missingPathFor(record));
  }

  reportUrlFor(report: HouseReport): string {
    return this.urlFor(this.reportPathFor(report));
  }

  aidOfferUrl(): string {
    return this.urlFor(this.aidOfferPath());
  }

  shareMissing(record: MissingRecord): Promise<PublicRecordShareResult> {
    return this.share({
      title: `${record.name} · ${record.municipality}`,
      url: this.missingUrlFor(record),
    });
  }

  shareReport(report: HouseReport): Promise<PublicRecordShareResult> {
    return this.share({
      title: this.i18n.t('share.reportTitle', { municipality: report.municipality }),
      url: this.reportUrlFor(report),
    });
  }

  shareAidOffer(): Promise<PublicRecordShareResult> {
    return this.share({
      title: this.i18n.t('aidOffer.shareTitle'),
      url: this.aidOfferUrl(),
    });
  }

  private async share(data: ShareData): Promise<PublicRecordShareResult> {
    if (!isPlatformBrowser(this.platformId)) return 'failed';

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(data);
        return 'shared';
      } catch (error) {
        if ((error as { name?: string } | null)?.name === 'AbortError') return 'cancelled';
      }
    }

    try {
      await navigator.clipboard.writeText(data.url ?? '');
      return 'copied';
    } catch {
      return 'failed';
    }
  }

  private urlFor(path: string): string {
    return new URL(path, this.document.location.origin).toString();
  }

  private slug(parts: string[]): string {
    return parts
      .join('-')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
