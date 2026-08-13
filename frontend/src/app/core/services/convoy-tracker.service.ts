import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConvoyStatus } from '../constants/app.constants';
import { TranslationKey } from '../i18n/es.translations';
import { I18nService } from '../i18n/i18n.service';
import { ConvoysService } from './convoys.service';

const STORAGE_KEY = 'redayuda.convoy-trip';
/** Ritmo de las señales: suficiente para dibujar el camino sin gastar la batería. */
const PING_INTERVAL_MS = 15_000;

/** El viaje que conduce quien usa este dispositivo, con su llave para moverlo. */
interface TrackedTrip {
  id: string;
  editPin: string;
}

/**
 * Envía la posición del camión mientras quien conduce lo tenga autorizado. El PIN se
 * guarda en este dispositivo porque es lo único que permite seguir mandando señales
 * después de recargar; se borra al terminar el viaje o al dejar de compartir.
 */
@Injectable({ providedIn: 'root' })
export class ConvoyTrackerService {
  private readonly convoys = inject(ConvoysService);
  private readonly i18n = inject(I18nService);

  private watchId: number | null = null;
  private lastSentAt = 0;

  private readonly tracked = signal<TrackedTrip | null>(this.readStoredTrip());
  readonly sharing = signal(false);
  private readonly errorKey = signal<TranslationKey | null>(null);

  /** El viaje propio, tal como lo ve todo el mundo, o `null` si ya no está en la lista. */
  readonly trip = computed(() => {
    const id = this.tracked()?.id;
    return id ? (this.convoys.trips().find((trip) => trip.id === id) ?? null) : null;
  });

  readonly errorMessage = computed(() => {
    const key = this.errorKey();
    return key ? this.i18n.t(key) : '';
  });

  constructor() {
    // Recargar la página no puede cortar el rastreo: si el viaje sigue vivo, se retoma.
    effect(() => {
      const trip = this.trip();
      if (!trip) return;
      if (trip.shareLocation && this.isOpen(trip.status)) this.start();
      else this.stop();
    });
  }

  /** Guarda el viaje recién anunciado y empieza a mandar señales si se autorizó. */
  remember(id: string, editPin: string): void {
    this.tracked.set({ id, editPin });
    this.persist({ id, editPin });
  }

  start(): void {
    if (this.watchId !== null) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.errorKey.set('convoyTracker.unsupported');
      return;
    }

    this.errorKey.set(null);
    this.sharing.set(true);
    this.watchId = navigator.geolocation.watchPosition(
      (position) => void this.sendPing(position),
      (error) => this.onGeolocationError(error),
      { enableHighAccuracy: true, maximumAge: PING_INTERVAL_MS, timeout: 30_000 },
    );
  }

  stop(): void {
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
    this.sharing.set(false);
  }

  /** Apaga el rastreo en el servidor: se borra el camino recorrido. */
  async stopSharing(): Promise<void> {
    this.stop();
    await this.changeTrip({ shareLocation: false });
  }

  async resumeSharing(): Promise<void> {
    await this.changeTrip({ shareLocation: true, status: ConvoyStatus.EN_ROUTE });
  }

  async markArrived(): Promise<void> {
    this.stop();
    await this.changeTrip({ status: ConvoyStatus.ARRIVED });
    this.forget();
  }

  /** Olvida el viaje en este dispositivo; el viaje sigue publicado como esté. */
  forget(): void {
    this.stop();
    this.tracked.set(null);
    this.persist(null);
  }

  private async changeTrip(changes: {
    status?: ConvoyStatus;
    shareLocation?: boolean;
  }): Promise<void> {
    const tracked = this.tracked();
    if (!tracked) return;
    try {
      await firstValueFrom(this.convoys.updateTrip(tracked.id, changes, tracked.editPin));
      this.errorKey.set(null);
    } catch {
      this.errorKey.set('convoyTracker.updateError');
    }
  }

  private async sendPing(position: GeolocationPosition): Promise<void> {
    const tracked = this.tracked();
    const now = Date.now();
    if (!tracked || now - this.lastSentAt < PING_INTERVAL_MS) return;
    this.lastSentAt = now;

    try {
      await firstValueFrom(
        this.convoys.sendPing(
          tracked.id,
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          tracked.editPin,
        ),
      );
      this.errorKey.set(null);
    } catch {
      // La siguiente señal vuelve a intentarlo: un bache de red no cierra el viaje.
      this.errorKey.set('convoyTracker.pingError');
    }
  }

  private onGeolocationError(error: GeolocationPositionError): void {
    this.stop();
    this.errorKey.set(
      error.code === error.PERMISSION_DENIED ? 'convoyTracker.denied' : 'convoyTracker.unavailable',
    );
  }

  private isOpen(status: ConvoyStatus): boolean {
    return status === ConvoyStatus.SCHEDULED || status === ConvoyStatus.EN_ROUTE;
  }

  private readStoredTrip(): TrackedTrip | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as TrackedTrip) : null;
    } catch {
      return null;
    }
  }

  private persist(trip: TrackedTrip | null): void {
    try {
      if (trip) localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Modo privado o almacenamiento bloqueado: el viaje vive solo en esta pestaña.
    }
  }
}
