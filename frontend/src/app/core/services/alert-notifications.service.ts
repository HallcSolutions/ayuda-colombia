import { Injectable, inject, signal } from '@angular/core';
import { UrgencyLevel } from '../constants/app.constants';
import { supplyCategoryKey, urgencyKey } from '../i18n/domain-keys';
import { I18nService } from '../i18n/i18n.service';
import { AidAlert } from '../models/aid-alert.model';
import { RealtimeService } from './realtime.service';
import { RegionService } from './region.service';

export type NotificationSupport = NotificationPermission | 'unsupported';

/** Avisa con una notificación del navegador cada vez que un punto pide ayuda. */
@Injectable({ providedIn: 'root' })
export class AlertNotificationsService {
  private readonly i18n = inject(I18nService);
  private readonly region = inject(RegionService);
  readonly permission = signal<NotificationSupport>(this.readPermission());

  constructor(realtime: RealtimeService) {
    realtime.listen<AidAlert>('/alerts', { 'alert.created': (alert) => this.notify(alert) });
  }

  get supported(): boolean {
    return this.permission() !== 'unsupported';
  }

  async requestPermission(): Promise<void> {
    if (!this.supported) return;
    this.permission.set(await Notification.requestPermission());
  }

  private notify(alert: AidAlert): void {
    if (!this.region.matches(alert.reliefPoint)) return;
    navigator.vibrate?.([200, 100, 200]);
    if (this.permission() !== 'granted') return;
    new Notification(this.i18n.t('notification.title', { point: alert.reliefPoint.name }), {
      body: this.buildBody(alert),
      tag: alert.id,
      requireInteraction: alert.severity === UrgencyLevel.CRITICAL,
    });
  }

  private buildBody(alert: AidAlert): string {
    const headline = this.i18n.t('notification.body', {
      category: this.i18n.t(supplyCategoryKey(alert.category)),
      quantity: alert.requestedQuantity ? ` (${alert.requestedQuantity})` : '',
      severity: this.i18n.t(urgencyKey(alert.severity)).toLowerCase(),
    });
    return `${headline}\n${alert.reliefPoint.municipality}: ${alert.message}`;
  }

  private readPermission(): NotificationSupport {
    return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
  }
}
