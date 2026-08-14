import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { GeocodingService } from './geocoding.service';

describe('GeocodingService', () => {
  let http: HttpTestingController;
  let service: GeocodingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(GeocodingService);
  });

  afterEach(() => http.verify());

  it('usa Photon directamente si el API propio no responde', async () => {
    const result = firstValueFrom(service.reverseLocation(3.4474058, -76.5365293));

    http.expectOne('/api/geocoding/reverse?latitude=3.4474058&longitude=-76.5365293').flush(
      { message: 'API no disponible' },
      { status: 503, statusText: 'Service Unavailable' },
    );
    const fallback = http.expectOne(
      'https://photon.komoot.io/reverse?lat=3.4474058&lon=-76.5365293&limit=1&radius=2',
    );
    fallback.flush({
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
    });

    await expect(result).resolves.toMatchObject({
      address: 'FENALCO Valle del Cauca, Calle 5',
      municipality: 'Cali',
      department: 'Valle del Cauca',
    });
  });
});
