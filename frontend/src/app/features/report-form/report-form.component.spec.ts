import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import {
  HelpContactChannel,
  HelpContactRole,
  UrgencyLevel,
} from '../../core/constants/app.constants';
import { HouseReport } from '../../core/models/house-report.model';
import { ReportsService } from '../../core/services/reports.service';
import { ReportFormComponent } from './report-form.component';

describe('ReportFormComponent', () => {
  const createReport = vi.fn((_: FormData) => of({} as HouseReport));

  beforeEach(() => {
    createReport.mockClear();
    TestBed.configureTestingModule({
      imports: [ReportFormComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ReportsService, useValue: { createReport } },
      ],
    });
  });

  it('publica el registro mínimo sin cédula, foto ni GPS', async () => {
    const component = TestBed.createComponent(ReportFormComponent).componentInstance;
    component.reportForm.setValue({
      department: 'Chocó',
      municipality: 'Istmina',
      addressReference: 'Sector La Esperanza',
      householdSize: 4,
      urgency: UrgencyLevel.HIGH,
      notice: '',
      reporterName: 'Marta',
      contactPhone: '3001234567',
      contactRole: HelpContactRole.AFFECTED_PERSON,
      contactChannel: HelpContactChannel.BOTH,
      consentToDirectContact: true,
      latitude: null,
      longitude: null,
      accuracy: null,
      consentToShareLocation: false,
    });
    component.toggleNeed('Agua potable');
    expect(component.isIncomplete()).toBe(false);

    await component.submitReport();

    expect(createReport).toHaveBeenCalledOnce();
    const [payload] = createReport.mock.calls[0];
    expect(payload.get('needs')).toBe('["Agua potable"]');
    expect(payload.has('documentId')).toBe(false);
    expect(payload.has('latitude')).toBe(false);
    expect(payload.has('longitude')).toBe(false);
    expect(payload.getAll('photos')).toHaveLength(0);
    expect(component.selectedNeeds()).toEqual([]);
  });

  it('permite registrar el caso aunque la familia prefiera mantener privado el contacto', () => {
    const component = TestBed.createComponent(ReportFormComponent).componentInstance;
    component.reportForm.patchValue({
      department: 'Chocó',
      municipality: 'Istmina',
      addressReference: 'Sector La Esperanza',
      reporterName: 'Marta',
      contactPhone: '3001234567',
      consentToDirectContact: false,
    });

    expect(component.reportForm.valid).toBe(true);
  });

  it('no ofrece el botón vacío y expone los errores por campo al tocarlos', async () => {
    const fixture = TestBed.createComponent(ReportFormComponent);
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);

    fixture.componentInstance.reportForm.markAllAsTouched();
    await fixture.componentInstance.submitReport();
    fixture.detectChanges();

    const department = fixture.nativeElement.querySelector(
      '[formControlName="department"]',
    ) as HTMLSelectElement;
    const needs = fixture.nativeElement.querySelector('.needs-grid') as HTMLElement;
    expect(createReport).not.toHaveBeenCalled();
    expect(department.required).toBe(true);
    expect(department.getAttribute('aria-required')).toBe('true');
    expect(department.getAttribute('aria-invalid')).toBe('true');
    expect(department.getAttribute('aria-describedby')).toBe('report-department-error');
    expect(needs.getAttribute('role')).toBe('group');
    expect(needs.getAttribute('aria-describedby')).toBe('report-needs-error');
    expect(fixture.nativeElement.querySelectorAll('[role="alert"].field-error').length).toBe(6);
  });

  it('conserva los datos cuando la API rechaza el reporte y muestra el error', async () => {
    createReport.mockReturnValueOnce(throwError(() => new Error('network')));
    const component = TestBed.createComponent(ReportFormComponent).componentInstance;
    component.reportForm.patchValue({
      department: 'Chocó',
      municipality: 'Istmina',
      addressReference: 'Sector La Esperanza',
      reporterName: 'Marta',
      contactPhone: '3001234567',
    });
    component.toggleNeed('Agua potable');

    await component.submitReport();

    expect(component.errorMessage()).toContain('could not be published');
    expect(component.reportForm.controls.reporterName.value).toBe('Marta');
    expect(component.selectedNeeds()).toEqual(['Agua potable']);
    expect(component.submitting()).toBe(false);
  });
});
