import {
  DEFAULT_TRUCK_SPEED_KMH,
  TrailPoint,
  estimateArrival,
  observedSpeedKmh,
} from './tracking';

const NOW = new Date('2026-08-13T15:00:00Z');

/** Camino hacia el oriente: un grado de longitud son unos 111 km en el ecuador. */
const trailAt = (offsets: { minutesAgo: number; km: number }[]): TrailPoint[] =>
  offsets.map(({ minutesAgo, km }) => ({
    latitude: 0,
    longitude: km / 111.195,
    recordedAt: new Date(NOW.getTime() - minutesAgo * 60_000),
  }));

describe('observedSpeedKmh', () => {
  it('no se pronuncia con una sola señal', () => {
    expect(
      observedSpeedKmh(trailAt([{ minutesAgo: 0, km: 0 }]), NOW),
    ).toBeNull();
  });

  it('mide la marcha sobre el camino recorrido', () => {
    const trail = trailAt([
      { minutesAgo: 10, km: 0 },
      { minutesAgo: 0, km: 10 },
    ]);

    expect(observedSpeedKmh(trail, NOW)).toBeCloseTo(60, 0);
  });

  it('ignora lo que pasó fuera de la ventana reciente', () => {
    const trail = trailAt([
      { minutesAgo: 300, km: 0 },
      { minutesAgo: 250, km: 200 },
    ]);

    expect(observedSpeedKmh(trail, NOW)).toBeNull();
  });

  it('no se cree un salto imposible del GPS', () => {
    const trail = trailAt([
      { minutesAgo: 1, km: 0 },
      { minutesAgo: 0, km: 50 },
    ]);

    expect(observedSpeedKmh(trail, NOW)).toBe(100);
  });
});

describe('estimateArrival', () => {
  it('proyecta con la marcha real del camión', () => {
    const eta = estimateArrival(120, 60, NOW);

    expect(eta?.toISOString()).toBe('2026-08-13T17:00:00.000Z');
  });

  it('usa la marcha de referencia cuando el camión está detenido', () => {
    const eta = estimateArrival(DEFAULT_TRUCK_SPEED_KMH, 0, NOW);

    expect(eta?.toISOString()).toBe('2026-08-13T16:00:00.000Z');
  });

  it('no promete hora si todavía no sabe cuánto falta', () => {
    expect(estimateArrival(null, 60, NOW)).toBeNull();
  });
});
