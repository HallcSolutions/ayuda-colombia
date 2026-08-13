import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  COLOMBIA_DEPARTMENT_SHAPES,
  COLOMBIA_MAP_BOUNDS,
  COLOMBIA_MAP_HEIGHT,
  COLOMBIA_MAP_WIDTH,
} from '../../core/constants/colombia-map.constants';
import { RegionService } from '../../core/services/region.service';
import { ColombiaMap } from './colombia-map';
import { MapMarker } from './colombia-map.model';

/** Dos ciudades vecinas de la costa: sus nombres no caben a la vez sin acercarse. */
const BARRANQUILLA: MapMarker = {
  id: 'barranquilla',
  latitude: 10.96,
  longitude: -74.8,
  department: 'Atlántico',
  municipality: 'Barranquilla',
  label: 'Acopio Barranquilla',
  tone: 'active',
  urgent: false,
};

const CARTAGENA: MapMarker = {
  ...BARRANQUILLA,
  id: 'cartagena',
  latitude: 10.39,
  longitude: -75.51,
  department: 'Bolívar',
  municipality: 'Cartagena',
  label: 'Acopio Cartagena',
};

/** Un punto justo donde el mapa escribiría el nombre de ese departamento. */
function markerOverTheNameOf(department: string): MapMarker {
  const shape = COLOMBIA_DEPARTMENT_SHAPES.find((item) => item.name === department)!;
  const { west, east, south, north } = COLOMBIA_MAP_BOUNDS;
  return {
    ...BARRANQUILLA,
    id: 'sobre-el-nombre',
    department,
    municipality: 'Centro',
    label: `Acopio de ${department}`,
    longitude: west + (shape.labelX / COLOMBIA_MAP_WIDTH) * (east - west),
    latitude: north - (shape.labelY / COLOMBIA_MAP_HEIGHT) * (north - south),
  };
}

const LETICIA: MapMarker = {
  ...BARRANQUILLA,
  id: 'leticia',
  latitude: -4.2,
  longitude: -69.94,
  department: 'Amazonas',
  municipality: 'Leticia',
  label: 'Puesto Leticia',
};

describe('ColombiaMap', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  const mapWith = (markers: MapMarker[]) => {
    const fixture = TestBed.createComponent(ColombiaMap);
    fixture.componentRef.setInput('markers', markers);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('agrupa por ciudad mientras no haya un departamento enfocado', () => {
    const map = mapWith([BARRANQUILLA, CARTAGENA, LETICIA]);

    expect(map.pins().length).toBe(3);
    expect(map.pins().every((pin) => pin.count === 1)).toBe(true);
  });

  it('reúne en una sola chincheta los puntos de la misma ciudad', () => {
    const map = mapWith([BARRANQUILLA, { ...BARRANQUILLA, id: 'otro' }]);

    expect(map.pins().length).toBe(1);
    expect(map.pins()[0].count).toBe(2);
    expect(map.pins()[0].marker).toBeNull();
  });

  it('escribe un solo nombre cuando dos chinchetas quedan encima', () => {
    const map = mapWith([BARRANQUILLA, CARTAGENA]);

    const written = map.pins().filter((pin) => pin.caption);
    expect(written.length).toBe(1);
    expect(map.pins().length).toBe(2);
  });

  it('deja sin nombre al departamento que pisaría el nombre de una chincheta', () => {
    const names = (map: ColombiaMap) => map.departmentLabels().map((label) => label.name);
    const empty = names(mapWith([]));
    const withPin = names(mapWith([markerOverTheNameOf('Vichada')]));

    expect(empty).toContain('Vichada');
    expect(withPin).not.toContain('Vichada');
    expect(withPin.every((name) => empty.includes(name))).toBe(true);
  });

  it('acerca el mapa al departamento enfocado y deja solo sus ciudades', () => {
    const map = mapWith([BARRANQUILLA, CARTAGENA]);
    TestBed.inject(RegionService).setDepartment('Atlántico');

    expect(map.zoom().scale).toBeGreaterThan(1);
    expect(map.pins().map((pin) => pin.municipality)).toEqual(['Barranquilla']);
  });

  it('dentro de un departamento sigue mostrando ciudades, no puntos sueltos', () => {
    const map = mapWith([BARRANQUILLA, { ...BARRANQUILLA, id: 'otro' }, CARTAGENA]);
    TestBed.inject(RegionService).setDepartment('Atlántico');

    expect(map.pins().length).toBe(1);
    expect(map.pins()[0].count).toBe(2);
    expect(map.pins()[0].marker).toBeNull();
  });

  it('abre en abanico las chinchetas de puntos que están a pocas cuadras', () => {
    // Dos puntos de la misma manzana: sin abanico saldrían uno encima del otro.
    const vecino = { ...BARRANQUILLA, id: 'vecino', latitude: 10.9603, longitude: -74.7997 };
    const map = mapWith([{ ...BARRANQUILLA, latitude: 10.96, longitude: -74.8 }, vecino]);
    TestBed.inject(RegionService).setDepartment('Atlántico');
    TestBed.inject(RegionService).setMunicipality('Barranquilla');

    const [first, second] = map.pins();
    const separation = Math.hypot(first.x - second.x, first.y - second.y);
    expect(map.pins().length).toBe(2);
    expect(separation).toBeGreaterThan(34 / map.zoom().scale / 2);
  });

  it('al elegir la ciudad separa sus puntos y se acerca todavía más', () => {
    const map = mapWith([BARRANQUILLA, { ...BARRANQUILLA, id: 'otro' }, CARTAGENA]);
    const region = TestBed.inject(RegionService);
    region.setDepartment('Atlántico');
    const departmentZoom = map.zoom().scale;
    region.setMunicipality('Barranquilla');

    expect(map.pins().map((pin) => pin.marker?.id)).toEqual(['barranquilla', 'otro']);
    expect(map.zoom().scale).toBeGreaterThan(departmentZoom);
  });
});
