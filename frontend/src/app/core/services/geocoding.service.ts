import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface';
import { AddressSuggestion } from '../models/address-suggestion.model';

const ENDPOINT = '/api/geocoding/addresses';
const PHOTON_REVERSE_ENDPOINT = 'https://photon.komoot.io/reverse';

interface PhotonFeature {
  geometry?: { coordinates?: unknown[] };
  properties?: Record<string, unknown>;
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

export interface AddressSearch {
  query: string;
  department?: string;
  municipality?: string;
}

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly http = inject(HttpClient);

  searchAddresses(search: AddressSearch): Observable<AddressSuggestion[]> {
    let params = new HttpParams().set('query', search.query);
    if (search.department) params = params.set('department', search.department);
    if (search.municipality) params = params.set('municipality', search.municipality);

    return this.http
      .get<ApiResponse<AddressSuggestion[]>>(ENDPOINT, { params })
      .pipe(map((response) => response.data));
  }

  reverseLocation(latitude: number, longitude: number): Observable<AddressSuggestion | null> {
    const params = new HttpParams()
      .set('latitude', latitude)
      .set('longitude', longitude);
    return this.http
      .get<ApiResponse<AddressSuggestion | null>>('/api/geocoding/reverse', { params })
      .pipe(
        map((response) => response.data),
        // El API propio sigue siendo la ruta principal (caché y rate limit). Este respaldo
        // permite completar el formulario si el backend aún no se reinició o no tiene salida.
        catchError(() => this.reverseLocationDirect(latitude, longitude)),
      );
  }

  private reverseLocationDirect(
    latitude: number,
    longitude: number,
  ): Observable<AddressSuggestion | null> {
    const params = new HttpParams()
      .set('lat', latitude)
      .set('lon', longitude)
      .set('limit', 1)
      .set('radius', 2);
    return this.http
      .get<PhotonResponse>(PHOTON_REVERSE_ENDPOINT, { params })
      .pipe(map((response) => this.normalizePhotonFeature(response.features?.[0])));
  }

  private normalizePhotonFeature(feature?: PhotonFeature): AddressSuggestion | null {
    if (!feature) return null;
    const longitude = Number(feature.geometry?.coordinates?.[0]);
    const latitude = Number(feature.geometry?.coordinates?.[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    const properties = feature.properties ?? {};
    const municipality = this.firstText(
      properties,
      'city',
      'town',
      'village',
      'county',
      'district',
    );
    const department = this.firstText(properties, 'state');
    const street = this.firstText(properties, 'street');
    const houseNumber = this.firstText(properties, 'housenumber');
    const name = this.firstText(properties, 'name');
    const streetAddress = [street, houseNumber].filter(Boolean).join(' ');
    const address = this.uniqueParts([name, streetAddress]).join(', ');
    const label = this.uniqueParts([address, municipality, department]).join(', ');
    if (!label) return null;

    const osmType = this.firstText(properties, 'osm_type') || 'place';
    const osmId = this.firstText(properties, 'osm_id') || `${latitude}:${longitude}`;
    return {
      id: `${osmType}:${osmId}`,
      label,
      address: address || label,
      municipality,
      department,
      latitude,
      longitude,
    };
  }

  private firstText(properties: Record<string, unknown>, ...keys: string[]): string {
    for (const key of keys) {
      const value = properties[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number') return String(value);
    }
    return '';
  }

  private uniqueParts(parts: string[]): string[] {
    const seen = new Set<string>();
    return parts.filter((part) => {
      const normalized = part.trim().toLocaleLowerCase('es-CO');
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }
}
