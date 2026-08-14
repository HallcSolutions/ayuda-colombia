import { Injectable, computed, signal } from '@angular/core';

const SHOW_DELAY_MS = 180;
const MINIMUM_VISIBLE_MS = 520;

/**
 * Coordina la carga inicial y las peticiones posteriores sin hacer parpadear la interfaz.
 * La primera visita y las actualizaciones comparten una línea fija que no cubre ni desplaza
 * la interfaz.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pendingRequests = signal(0);
  private readonly initialHold = signal(true);
  private readonly initialCompleted = signal(false);
  private readonly shown = signal(true);

  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private shownAt = Date.now();

  readonly visible = computed(() => this.shown());
  readonly isInitial = computed(() => !this.initialCompleted());

  begin(): void {
    this.pendingRequests.update((count) => count + 1);
    this.clearHideTimer();

    if (this.shown() || this.showTimer) {
      return;
    }

    // Las respuestas rápidas no necesitan tapar la interfaz con un destello.
    this.showTimer = setTimeout(() => {
      this.showTimer = null;
      if (this.pendingRequests() > 0) {
        this.shownAt = Date.now();
        this.shown.set(true);
      }
    }, SHOW_DELAY_MS);
  }

  end(): void {
    this.pendingRequests.update((count) => Math.max(0, count - 1));
    if (this.pendingRequests() === 0) {
      this.scheduleHide();
    }
  }

  /** Angular ya pintó la aplicación; ahora esperamos únicamente las solicitudes activas. */
  releaseInitial(): void {
    this.initialHold.set(false);
    if (this.pendingRequests() === 0) {
      this.scheduleHide();
    }
  }

  private scheduleHide(): void {
    if (this.initialHold()) {
      return;
    }

    this.clearShowTimer();
    if (!this.shown()) {
      this.initialCompleted.set(true);
      return;
    }

    const remaining = Math.max(0, MINIMUM_VISIBLE_MS - (Date.now() - this.shownAt));
    this.clearHideTimer();
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      if (this.pendingRequests() === 0 && !this.initialHold()) {
        this.shown.set(false);
        this.initialCompleted.set(true);
      }
    }, remaining);
  }

  private clearShowTimer(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
  }

  private clearHideTimer(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}
