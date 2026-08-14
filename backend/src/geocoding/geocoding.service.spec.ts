import { ConfigService } from '@nestjs/config';
import { GeocodingService } from './geocoding.service';

describe('GeocodingService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('convierte coordenadas en campos separados de dirección', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: {
              osm_type: 'N',
              osm_id: 7560405372,
              name: 'FENALCO Valle del Cauca',
              street: 'Calle 5',
              city: 'Cali',
              state: 'Valle del Cauca',
            },
            geometry: { coordinates: [-76.5365293, 3.4474058] },
          },
        ],
      }),
    } as Response);
    const config = { get: jest.fn().mockReturnValue('https://photon.test/api') };
    const service = new GeocodingService(config as unknown as ConfigService);

    await expect(service.reverse(3.4474058, -76.5365293)).resolves.toEqual({
      id: 'N:7560405372',
      label: 'FENALCO Valle del Cauca, Calle 5, Cali, Valle del Cauca',
      address: 'FENALCO Valle del Cauca, Calle 5',
      municipality: 'Cali',
      department: 'Valle del Cauca',
      latitude: 3.4474058,
      longitude: -76.5365293,
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/reverse?lat=3.4474058&lon=-76.5365293&limit=1&radius=2',
    );
  });
});
