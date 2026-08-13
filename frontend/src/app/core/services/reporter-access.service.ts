import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'redayuda.reporter-code';

/** Guarda el código de brigadista para que todos los formularios usen el mismo. */
@Injectable({ providedIn: 'root' })
export class ReporterAccessService {
  readonly code = signal(this.readStoredCode());

  setCode(code: string): void {
    const trimmed = code.trim();
    this.code.set(trimmed);
    try {
      if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Modo privado o almacenamiento bloqueado: el código vive solo en memoria.
    }
  }

  private readStoredCode(): string {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  }
}
