import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { ReliefPointType } from '../constants/app.constants';
import { I18nService } from '../i18n/i18n.service';
import { ReliefPoint } from '../models/relief-point.model';

export type ReliefPointShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

const TYPE_SLUG: Record<ReliefPointType, string> = {
  [ReliefPointType.COLLECTION_CENTER]: 'punto-de-acopio',
  [ReliefPointType.COMMUNITY_KITCHEN]: 'comedor-comunitario',
  [ReliefPointType.SHELTER]: 'albergue',
  [ReliefPointType.MEDICAL_POST]: 'puesto-de-salud',
  [ReliefPointType.VETERINARY]: 'atencion-veterinaria',
};

/**
 * Comparte una URL estable de la ficha, no la pantalla filtrada del directorio. En
 * teléfonos abre las aplicaciones instaladas; en los demás equipos copia el enlace.
 */
@Injectable({ providedIn: 'root' })
export class ReliefPointShareService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly i18n = inject(I18nService);

  pathFor(point: ReliefPoint): string {
    const readableName = `${point.name}-${point.municipality}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const type = TYPE_SLUG[point.type];
    const clearSlug = readableName.startsWith(`${type}-`)
      ? readableName
      : `${type}-${readableName}`;
    return `/puntos/${clearSlug}/${encodeURIComponent(point.id)}`;
  }

  urlFor(point: ReliefPoint): string {
    return new URL(this.pathFor(point), this.document.location.origin).toString();
  }

  async share(point: ReliefPoint): Promise<ReliefPointShareResult> {
    if (!isPlatformBrowser(this.platformId)) return 'failed';

    const url = this.urlFor(point);
    const data: ShareData = {
      title: point.name,
      text: this.i18n.t('reliefPointCard.shareText', {
        point: point.name,
        municipality: point.municipality,
      }),
      url,
    };

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(data);
        return 'shared';
      } catch (error) {
        if ((error as { name?: string } | null)?.name === 'AbortError') return 'cancelled';
        // Si el menú nativo falla, todavía se puede entregar el enlace copiándolo.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      return 'copied';
    } catch {
      return 'failed';
    }
  }
}
