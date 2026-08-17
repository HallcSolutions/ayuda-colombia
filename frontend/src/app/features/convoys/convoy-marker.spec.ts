import {
  ConvoyStatus,
  ReliefPointType,
  RouteSource,
  SupplyCategory,
} from '../../core/constants/app.constants';
import { ConvoyTrip } from '../../core/models/convoy-trip.model';
import { toMapMarker, toMapTrails } from './convoy-marker';

const IBAGUE = { latitude: 4.4389, longitude: -75.2322 };
const CALI = { latitude: 3.4516, longitude: -76.532 };

const trip = (overrides: Partial<ConvoyTrip> = {}): ConvoyTrip => ({
  id: 'trip-1',
  driverName: 'Jorge Rendón',
  contactPhone: '3010001122',
  vehiclePlate: 'SXK123',
  vehicleDescription: 'Camión sencillo',
  cargo: [SupplyCategory.WATER],
  cargoNotes: '',
  originDepartment: 'Bogotá D.C.',
  originMunicipality: 'Bogotá',
  destination: {
    id: 'point-1',
    name: 'Acopio Unidad Deportiva',
    type: ReliefPointType.COLLECTION_CENTER,
    department: 'Valle del Cauca',
    municipality: 'Cali',
    latitude: CALI.latitude,
    longitude: CALI.longitude,
  },
  departureAt: '2026-08-13T12:00:00.000Z',
  status: ConvoyStatus.EN_ROUTE,
  shareLocation: true,
  position: IBAGUE,
  lastPingAt: '2026-08-13T15:00:00.000Z',
  speedKmh: 62,
  remainingKm: 225,
  etaAt: '2026-08-13T18:37:00.000Z',
  routeSource: RouteSource.ROAD,
  arrivedAt: null,
  trail: [{ latitude: 4.711, longitude: -74.0721 }, IBAGUE],
  remainingRoute: [IBAGUE, CALI],
  createdAt: '2026-08-13T11:00:00.000Z',
  updatedAt: '2026-08-13T15:00:00.000Z',
  ...overrides,
});

describe('toMapMarker', () => {
  it('ubica el camión donde va y lo asocia a la zona que lo espera', () => {
    const marker = toMapMarker(trip());

    expect(marker).toMatchObject({
      id: 'trip-1',
      latitude: IBAGUE.latitude,
      department: 'Valle del Cauca',
      municipality: 'Cali',
      tone: 'active',
      symbol: 'vehicle',
    });
    expect(marker?.rotation).toBeGreaterThan(180);
    expect(marker?.rotation).toBeLessThan(300);
  });

  it('no pone chincheta cuando el viaje no comparte ubicación', () => {
    expect(toMapMarker(trip({ position: null, shareLocation: false }))).toBeNull();
  });
});

describe('toMapTrails', () => {
  it('separa lo recorrido de lo que falta', () => {
    const [done, ahead] = toMapTrails(trip());

    expect(done).toMatchObject({ id: 'trip-1:done', pending: false });
    expect(done.points).toHaveLength(2);
    expect(ahead).toMatchObject({ id: 'trip-1:ahead', pending: true });
    // Lo que falta arranca en el camión, no en el primer punto de la carretera.
    expect(ahead.points[0]).toEqual(IBAGUE);
  });

  it('insinúa la recta al destino cuando no hubo carretera que calcular', () => {
    const [, ahead] = toMapTrails(trip({ remainingRoute: [] }));

    expect(ahead.points).toEqual([IBAGUE, expect.objectContaining({ latitude: CALI.latitude })]);
  });

  it('deja de dibujar caminos cuando el viaje ya terminó', () => {
    expect(toMapTrails(trip({ status: ConvoyStatus.ARRIVED }))).toEqual([]);
  });
});
