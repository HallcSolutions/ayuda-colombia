import { distanceKm, downsample, pathLengthKm, routeAhead } from './geo';

const BOGOTA = { latitude: 4.711, longitude: -74.0721 };
const IBAGUE = { latitude: 4.4389, longitude: -75.2322 };
const CALI = { latitude: 3.4516, longitude: -76.532 };

describe('geo', () => {
  it('mide la distancia entre dos ciudades con precisión de kilómetros', () => {
    // Bogotá y Cali están a unos 300 km en línea recta.
    expect(distanceKm(BOGOTA, CALI)).toBeGreaterThan(290);
    expect(distanceKm(BOGOTA, CALI)).toBeLessThan(310);
  });

  it('suma el camino tramo a tramo, no de punta a punta', () => {
    const straight = distanceKm(BOGOTA, CALI);
    expect(pathLengthKm([BOGOTA, IBAGUE, CALI])).toBeGreaterThan(straight);
  });

  describe('routeAhead', () => {
    const route = [BOGOTA, IBAGUE, CALI];

    it('descarta lo ya recorrido y deja lo que falta', () => {
      const ahead = routeAhead(route, IBAGUE);

      expect(ahead?.points).toEqual([IBAGUE, CALI]);
      expect(ahead?.km).toBeCloseTo(distanceKm(IBAGUE, CALI), 5);
      expect(ahead?.offRouteKm).toBeCloseTo(0, 5);
    });

    it('delata al camión que se salió de la carretera', () => {
      const detour = { latitude: 4.4389, longitude: -75.4 };

      expect(routeAhead(route, detour)?.offRouteKm).toBeGreaterThan(15);
    });

    it('no inventa un camino cuando todavía no hay ruta calculada', () => {
      expect(routeAhead([], BOGOTA)).toBeNull();
      expect(routeAhead([BOGOTA], BOGOTA)).toBeNull();
    });
  });

  describe('downsample', () => {
    it('deja el camino como está si ya cabe', () => {
      expect(downsample([1, 2, 3], 5)).toEqual([1, 2, 3]);
    });

    it('recorta conservando el principio y el final del camino', () => {
      const points = Array.from({ length: 100 }, (_, index) => index);
      const reduced = downsample(points, 5);

      expect(reduced).toHaveLength(5);
      expect(reduced[0]).toBe(0);
      expect(reduced[4]).toBe(99);
    });
  });
});
