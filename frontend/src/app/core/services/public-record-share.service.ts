import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import { HouseReport } from '../models/house-report.model';
import { MissingRecord } from '../models/missing-record.model';
import {
  BrowserShareResult,
  PublicSharePayload,
  sharePublicLink,
} from '../utils/browser-share.util';

export type PublicRecordShareResult = BrowserShareResult;

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
    return '/inicio?compartir=ayuda-andrea&v=20260817#ayuda-disponible-cali';
  }

  perlaDroneHelpPath(record: MissingRecord): string {
    const version = Date.parse(record.updatedAt) || record.updatedAt;
    return `/desaparecidos?compartir=ayuda-dron&v=${encodeURIComponent(String(version))}#como-ayudar-perla`;
  }

  missingUrlFor(record: MissingRecord): string {
    const url = new URL(this.missingPathFor(record), this.document.location.origin);
    const version = Date.parse(record.updatedAt) || record.updatedAt;
    url.searchParams.set('v', String(version));
    return url.toString();
  }

  reportUrlFor(report: HouseReport): string {
    return this.urlFor(this.reportPathFor(report));
  }

  aidOfferUrl(): string {
    return this.urlFor(this.aidOfferPath());
  }

  perlaDroneHelpUrl(record: MissingRecord): string {
    return this.urlFor(this.perlaDroneHelpPath(record));
  }

  shareMissing(record: MissingRecord): Promise<PublicRecordShareResult> {
    return this.share({
      title: `${record.name} · ${record.municipality}`,
      url: this.missingUrlFor(record),
      imageUrl: this.mediaUrl(record.photos[0] ?? '/assets/brand/redayuda-og.jpg'),
      fileName: this.slug([record.name, record.municipality]),
    });
  }

  shareReport(report: HouseReport): Promise<PublicRecordShareResult> {
    return this.share({
      title: this.i18n.t('share.reportTitle', { municipality: report.municipality }),
      url: this.reportUrlFor(report),
      imageUrl: this.mediaUrl(
        report.photos[0] ?? '/assets/reports/report-shelter-illustration.jpg',
      ),
      fileName: this.slug(['ayuda', report.municipality]),
    });
  }

  shareAidOffer(): Promise<PublicRecordShareResult> {
    return this.share({
      title: this.i18n.t('aidOffer.shareTitle'),
      url: this.aidOfferUrl(),
      imageUrl: this.mediaUrl('/assets/social/andrea-morales-ayuda-cali.png'),
      fileName: 'andrea-morales-ayuda-cali',
    });
  }

  sharePerlaDroneHelp(record: MissingRecord): Promise<PublicRecordShareResult> {
    return this.share({
      title: this.i18n.t('missing.help.title'),
      url: this.perlaDroneHelpUrl(record),
      imageUrl: this.mediaUrl(record.photos[0] ?? '/assets/brand/redayuda-og.jpg'),
      fileName: 'se-necesita-dron-para-perla',
    });
  }

  private urlFor(path: string): string {
    return new URL(path, this.document.location.origin).toString();
  }

  private mediaUrl(path: string): string {
    return new URL(path, this.document.location.origin).toString();
  }

  private share(payload: PublicSharePayload): Promise<PublicRecordShareResult> {
    return isPlatformBrowser(this.platformId)
      ? sharePublicLink(payload)
      : Promise.resolve('failed');
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
