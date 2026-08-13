import { Injectable, computed, effect, signal } from '@angular/core';
import { RegionAware, RegionSelection } from '../models/region.model';

const STORAGE_KEY = 'redayuda.region';

/**
 * La emergencia se coordina por departamento y ciudad: este servicio guarda la zona
 * elegida y la comparten los puntos de acopio, las comidas, las alertas y los reportes.
 */
@Injectable({ providedIn: 'root' })
export class RegionService {
  readonly department = signal('');
  readonly municipality = signal('');

  readonly selection = computed<RegionSelection>(() => ({
    department: this.department(),
    municipality: this.municipality(),
  }));

  /** `true` cuando el usuario limitó la vista a un departamento o ciudad. */
  readonly isFiltered = computed(() => Boolean(this.department() || this.municipality()));

  constructor() {
    this.restoreSelection();
    effect(() => this.persistSelection(this.selection()));
  }

  setDepartment(department: string): void {
    this.department.set(department);
    this.municipality.set('');
  }

  setMunicipality(municipality: string): void {
    this.municipality.set(municipality);
  }

  /** Indica si un punto, alerta o reporte pertenece a la zona seleccionada. */
  matches(item: RegionAware): boolean {
    const department = this.department();
    const municipality = this.municipality();
    return (
      (!department || item.department === department) &&
      (!municipality || item.municipality === municipality)
    );
  }

  private restoreSelection(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const { department, municipality } = JSON.parse(stored) as Partial<RegionSelection>;
      this.department.set(department ?? '');
      this.municipality.set(municipality ?? '');
    } catch {
      // Sin almacenamiento o dato corrupto: se empieza viendo todo el país.
    }
  }

  private persistSelection(selection: RegionSelection): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch {
      // La zona solo dura esta sesión.
    }
  }
}
