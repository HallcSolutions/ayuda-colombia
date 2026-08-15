import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RecoveryProjectKind, RecoveryProjectStatus } from '../constants/app.constants';
import { ApiResponse } from '../interfaces/api-response.interface';
import { RecoveryProject } from '../models/recovery.model';
import { RealtimeService } from './realtime.service';
import { RecoveryService } from './recovery.service';
import { RegionService } from './region.service';

describe('RecoveryService', () => {
  let http: HttpTestingController;
  let region: RegionService;
  let service: RecoveryService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RealtimeService, useValue: { listen: vi.fn() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    region = TestBed.inject(RegionService);
    service = TestBed.inject(RecoveryService);
  });

  afterEach(() => http.verify());

  it('ignora una respuesta regional anterior que termina después de la selección actual', () => {
    region.setDepartment('Bogotá D.C.');
    service.loadProjects();
    const bogotaRequest = http.expectOne(
      (request) => request.params.get('department') === 'Bogotá D.C.',
    );

    region.setDepartment('Atlántico');
    service.loadProjects();
    const atlanticoRequest = http.expectOne(
      (request) => request.params.get('department') === 'Atlántico',
    );

    atlanticoRequest.flush(response([project('atlantico', 'Atlántico', 'Barranquilla')]));
    bogotaRequest.flush(response([project('bogota', 'Bogotá D.C.', 'Bogotá')]));

    expect(service.projects().map((item) => item.id)).toEqual(['atlantico']);
    expect(service.loading()).toBe(false);
  });

  it('consulta las postulaciones privadas con el PIN del ayudante', () => {
    let applications: unknown;

    service.getHelperApplications('helper-qa', '831752').subscribe((value) => {
      applications = value;
    });

    const request = http.expectOne('/api/recovery/helpers/helper-qa/applications');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('x-helper-pin')).toBe('831752');
    request.flush({ success: true, data: [], message: 'Operación exitosa' });

    expect(applications).toEqual([]);
  });

  it('retira una postulación usando únicamente el acceso privado del ayudante', () => {
    service.withdrawApplication('application-qa', '831752').subscribe();

    const request = http.expectOne('/api/recovery/applications/application-qa/withdraw');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.headers.get('x-helper-pin')).toBe('831752');
    request.flush({ success: true, data: {}, message: 'Operación exitosa' });
  });
});

function response(data: RecoveryProject[]): ApiResponse<RecoveryProject[]> {
  return { success: true, data, message: 'Operación exitosa' };
}

function project(id: string, department: string, municipality: string): RecoveryProject {
  return {
    id,
    kind: RecoveryProjectKind.HOME,
    name: `Proyecto ${id}`,
    story: 'Registro de prueba',
    department,
    municipality,
    areaReference: 'Zona de prueba',
    productsOrServices: '',
    priceReference: '',
    salesModes: [],
    schedule: '',
    publicContactPhone: '',
    status: RecoveryProjectStatus.OPEN,
    verifiedBy: '',
    verifiedAt: null,
    pendingTaskCount: 0,
    tasks: [],
    createdAt: '2026-08-15T12:00:00.000Z',
    updatedAt: '2026-08-15T12:00:00.000Z',
  };
}
