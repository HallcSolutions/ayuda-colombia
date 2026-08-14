import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface';
import { AddressSuggestion } from '../models/address-suggestion.model';

const ENDPOINT = '/api/geocoding/addresses';

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
}
