import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchAddressDto } from './dto/search-address.dto';
import { AddressSuggestion } from './geocoding.interface';

interface PhotonFeature {
  geometry?: { coordinates?: unknown[] };
  properties?: Record<string, unknown>;
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

interface CacheEntry {
  expiresAt: number;
  suggestions: AddressSuggestion[];
}

const CACHE_TTL_MS = 5 * 60_000;
const MAX_CACHE_ENTRIES = 150;

@Injectable()
export class GeocodingService {
  private readonly endpoint: string;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(config: ConfigService) {
    this.endpoint = config.get('GEOCODING_BASE_URL', 'https://photon.komoot.io/api');
  }

  async search(dto: SearchAddressDto): Promise<AddressSuggestion[]> {
    const query = this.composeQuery(dto);
    const cacheKey = query.toLocaleLowerCase('es-CO');
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.suggestions;

    const url = new URL(this.endpoint);
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '6');
    url.searchParams.set('countrycode', 'co');

    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'RedAyuda-Colombia/1.0 address-search' },
        signal: AbortSignal.timeout(7_000),
      });
      if (!response.ok) throw new Error(`Geocoder responded ${response.status}`);

      const body = (await response.json()) as PhotonResponse;
      const suggestions = this.filterByMunicipality(
        this.normalize(body.features ?? []),
        dto.municipality,
      );
      this.remember(cacheKey, suggestions);
      return suggestions;
    } catch {
      throw new ServiceUnavailableException(
        'La búsqueda de direcciones no está disponible en este momento.',
      );
    }
  }

  private composeQuery(dto: SearchAddressDto): string {
    return [dto.query, dto.municipality, dto.department, 'Colombia']
      .map((part) => part?.trim())
      .filter((part, index, parts): part is string =>
        Boolean(part && parts.findIndex((item) => item?.toLowerCase() === part.toLowerCase()) === index),
      )
      .join(', ');
  }

  private normalize(features: PhotonFeature[]): AddressSuggestion[] {
    const seen = new Set<string>();
    const suggestions: AddressSuggestion[] = [];

    for (const feature of features) {
      const coordinates = feature.geometry?.coordinates;
      const longitude = Number(coordinates?.[0]);
      const latitude = Number(coordinates?.[1]);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

      const properties = feature.properties ?? {};
      const municipality = this.firstText(properties, 'city', 'town', 'village', 'county', 'district');
      const department = this.firstText(properties, 'state');
      const street = this.firstText(properties, 'street');
      const houseNumber = this.firstText(properties, 'housenumber');
      const name = this.firstText(properties, 'name');
      const streetAddress = [street, houseNumber].filter(Boolean).join(' ');
      const label = this.uniqueParts([
        name,
        streetAddress,
        municipality,
        department,
      ]).join(', ');
      if (!label || seen.has(label)) continue;

      const osmType = this.firstText(properties, 'osm_type') || 'place';
      const osmId = this.firstText(properties, 'osm_id') || `${latitude}:${longitude}`;
      seen.add(label);
      suggestions.push({
        id: `${osmType}:${osmId}`,
        label,
        municipality,
        department,
        latitude,
        longitude,
      });
    }

    return suggestions;
  }

  private firstText(properties: Record<string, unknown>, ...keys: string[]): string {
    for (const key of keys) {
      const value = properties[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number') return String(value);
    }
    return '';
  }

  private filterByMunicipality(
    suggestions: AddressSuggestion[],
    municipality?: string,
  ): AddressSuggestion[] {
    if (!municipality?.trim()) return suggestions;
    const expected = this.normalizePlace(municipality);
    const matches = suggestions.filter((suggestion) => {
      const candidate = this.normalizePlace(suggestion.municipality);
      return candidate === expected || candidate.includes(expected) || expected.includes(candidate);
    });
    // Algunos lugares rurales no traen municipio en OpenStreetMap. En ese caso es mejor
    // mostrar los resultados del departamento que dejar el buscador completamente vacío.
    return matches.length ? matches : suggestions;
  }

  private normalizePlace(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
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

  private remember(key: string, suggestions: AddressSuggestion[]): void {
    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      const oldest = this.cache.keys().next().value as string | undefined;
      if (oldest) this.cache.delete(oldest);
    }
    this.cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, suggestions });
  }
}
