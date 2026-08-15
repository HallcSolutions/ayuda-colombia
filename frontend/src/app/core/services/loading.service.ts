import { Injectable, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Observable,
  Subject,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  race,
  switchMap,
  take,
  timer,
} from 'rxjs';

const SHOW_DELAY_MS = 180;
const MINIMUM_VISIBLE_MS = 520;
/** El arranque se da por terminado cuando nadie pide datos durante este rato. */
const QUIET_PERIOD_MS = 260;
/** Si el servidor no contesta, la portada se retira igual: mejor una página vacía que una espera eterna. */
const BOOT_TIMEOUT_MS = 12000;

/**
 * Coordina la carga inicial y las peticiones posteriores sin hacer parpadear la interfaz.
 * Durante el arranque manda la portada completa del `index.html`, que no se retira hasta que
 * la primera pantalla está pintada y con datos; después basta una línea fija que no desplaza nada.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pendingRequests = signal(0);
  private readonly firstViewPainted = signal(false);
  private readonly bootingState = signal(true);
  private readonly shown = signal(false);

  /** Cada cambio en la carga: una petición que entra o que sale, o la primera pantalla ya pintada. */
  private readonly changes = new Subject<void>();
  private shownAt = 0;

  /** La portada de arranque sigue puesta mientras la primera pantalla termina de armarse. */
  readonly booting = computed(() => this.bootingState());
  /** Línea fina para las peticiones que llegan una vez la aplicación ya está a la vista. */
  readonly visible = computed(() => this.shown());
  readonly busy = computed(() => this.bootingState() || this.shown());

  constructor() {
    /*
     * La portada se retira cuando la pantalla lleva un momento sin pedir nada: así no se
     * descubre una página a medias que se reacomode —y mueva el pie— al llegar los datos.
     * La cuenta atrás es la red por si la primera pantalla no llega a estar nunca lista.
     */
    race(
      this.changes.pipe(
        debounceTime(QUIET_PERIOD_MS),
        filter(() => this.firstViewPainted() && this.pendingRequests() === 0),
      ),
      timer(BOOT_TIMEOUT_MS),
    )
      .pipe(take(1), takeUntilDestroyed())
      .subscribe(() => this.bootingState.set(false));

    // La línea solo aparece si la espera se alarga, y se queda un mínimo para no dar un destello.
    this.changes
      .pipe(
        map(() => this.pendingRequests() > 0),
        distinctUntilChanged(),
        switchMap((busy) => (busy ? timer(SHOW_DELAY_MS).pipe(map(() => true)) : this.fadeOut())),
        takeUntilDestroyed(),
      )
      .subscribe((visible) => this.applyVisible(visible));
  }

  begin(): void {
    this.pendingRequests.update((count) => count + 1);
    this.changes.next();
  }

  end(): void {
    this.pendingRequests.update((count) => Math.max(0, count - 1));
    this.changes.next();
  }

  /** Angular ya pintó la primera ruta; solo falta que lleguen sus datos. */
  markFirstViewPainted(): void {
    if (this.firstViewPainted()) {
      return;
    }

    this.firstViewPainted.set(true);
    this.changes.next();
  }

  /** Una línea que acaba de aparecer se queda a la vista lo justo para que se entienda. */
  private fadeOut(): Observable<boolean> {
    if (!this.shown()) {
      return of(false);
    }

    const remaining = Math.max(0, MINIMUM_VISIBLE_MS - (Date.now() - this.shownAt));
    return timer(remaining).pipe(map(() => false));
  }

  private applyVisible(visible: boolean): void {
    // Durante el arranque manda la portada: la línea sobraría debajo de ella.
    if (visible && this.bootingState()) {
      return;
    }

    if (visible) {
      this.shownAt = Date.now();
    }
    this.shown.set(visible);
  }
}
