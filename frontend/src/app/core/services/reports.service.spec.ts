import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ReportStatus, UrgencyLevel } from '../constants/app.constants';
import { HouseReport } from '../models/house-report.model';
import { RealtimeService } from './realtime.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let http: HttpTestingController;
  let service: ReportsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RealtimeService, useValue: { listen: vi.fn() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ReportsService);
  });

  afterEach(() => http.verify());

  it('registra una familia sin correo, cuenta ni código', async () => {
    const result = firstValueFrom(service.createReport(new FormData()));
    const request = http.expectOne('/api/reports');

    expect(request.request.headers.has('x-reporter-key')).toBe(false);
    request.flush({ success: true, data: report(), message: 'Operación exitosa' });
    await expect(result).resolves.toEqual(report());
  });
});

function report(): HouseReport {
  return {
    id: 'report-1',
    department: 'Chocó',
    municipality: 'Istmina',
    addressReference: 'Sector La Esperanza',
    householdSize: 4,
    urgency: UrgencyLevel.HIGH,
    needs: ['Agua potable'],
    notice: '',
    photos: [],
    location: null,
    directContact: null,
    fieldVerified: false,
    verifiedAt: null,
    status: ReportStatus.OPEN,
    consentToShareLocation: false,
    createdAt: '2026-08-15T12:00:00.000Z',
    updatedAt: '2026-08-15T12:00:00.000Z',
  };
}
