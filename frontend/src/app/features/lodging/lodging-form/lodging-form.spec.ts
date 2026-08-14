import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { GeocodingService } from '../../../core/services/geocoding.service';
import { LodgingService } from '../../../core/services/lodging.service';
import { LodgingForm } from './lodging-form';

const POSITION = {
  coords: {
    latitude: 3.4474058,
    longitude: -76.5365293,
    accuracy: 35,
  },
  timestamp: Date.now(),
} as GeolocationPosition;

const ADDRESS = {
  id: 'N:7560405372',
  label: 'FENALCO Valle del Cauca, Calle 5, Cali, Valle del Cauca',
  address: 'FENALCO Valle del Cauca, Calle 5',
  municipality: 'Cali',
  department: 'Valle del Cauca',
  latitude: POSITION.coords.latitude,
  longitude: POSITION.coords.longitude,
};

describe('LodgingForm', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition: (success: PositionCallback) => success(POSITION) },
    });
    TestBed.configureTestingModule({
      imports: [LodgingForm],
      providers: [
        provideZonelessChangeDetection(),
        { provide: LodgingService, useValue: {} },
        { provide: GeocodingService, useValue: { reverseLocation: () => of(ADDRESS) } },
      ],
    });
  });

  it('autocompleta alojamiento al usar la ubicación actual', async () => {
    const component = TestBed.createComponent(LodgingForm).componentInstance;

    component.captureCurrentLocation();
    await Promise.resolve();

    expect(component.form.getRawValue()).toMatchObject({
      department: 'Valle del Cauca',
      municipality: 'Cali',
      addressReference: 'FENALCO Valle del Cauca, Calle 5',
      latitude: 3.4474058,
      longitude: -76.5365293,
    });
  });
});
