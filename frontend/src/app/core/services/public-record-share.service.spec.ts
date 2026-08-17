import { TestBed } from '@angular/core/testing';
import {
  HelpContactChannel,
  HelpContactRole,
  MissingStatus,
  MissingSubjectKind,
  ReportStatus,
  UrgencyLevel,
} from '../constants/app.constants';
import { HouseReport } from '../models/house-report.model';
import { MissingRecord } from '../models/missing-record.model';
import { PublicRecordShareService } from './public-record-share.service';

const MISSING: MissingRecord = {
  id: 'df431bcc-700c-4404-94ae-e68d85e38677',
  kind: MissingSubjectKind.ANIMAL,
  name: 'Perla',
  ageYears: null,
  description: 'Gata blanca con manchas atigradas',
  department: 'Valle del Cauca',
  municipality: 'Cali',
  lastSeenPlace: 'La Merced',
  lastSeenAt: '2026-08-10T17:00:00.000Z',
  coordinates: null,
  contactName: 'Familia de Perla',
  contactPhone: '324 683 6638',
  photos: ['/uploads/perla.png'],
  sourceName: null,
  sourceUrl: null,
  sourceVerifiedAt: null,
  status: MissingStatus.SEARCHING,
  foundAt: null,
  createdAt: '2026-08-17T13:39:13.809Z',
  updatedAt: '2026-08-17T13:39:33.026Z',
};

const REPORT: HouseReport = {
  id: '1371f22f-6b87-4a9c-aad6-2f0994387f9a',
  department: 'Valle del Cauca',
  municipality: 'Cali',
  addressReference: 'Barrio La Merced',
  householdSize: 4,
  urgency: UrgencyLevel.HIGH,
  needs: ['shelter'],
  notice: '',
  photos: [],
  location: null,
  directContact: {
    name: 'Familia',
    phone: '300 000 0000',
    role: HelpContactRole.FAMILY_MEMBER,
    channel: HelpContactChannel.WHATSAPP,
  },
  fieldVerified: false,
  verifiedAt: null,
  status: ReportStatus.OPEN,
  consentToShareLocation: false,
  createdAt: '2026-08-17T12:00:00.000Z',
  updatedAt: '2026-08-17T12:00:00.000Z',
};

describe('PublicRecordShareService', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  });

  it('crea enlaces individuales y legibles para desaparecidos y ayuda directa', () => {
    const service = TestBed.inject(PublicRecordShareService);

    expect(service.missingPathFor(MISSING)).toBe(`/desaparecidos/perla-cali/${MISSING.id}`);
    expect(service.reportPathFor(REPORT)).toBe(
      `/reportes/ayuda-cali-barrio-la-merced/${REPORT.id}`,
    );
  });

  it('abre el menú nativo del celular con la ficha de Perla', async () => {
    const nativeShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: nativeShare });
    const service = TestBed.inject(PublicRecordShareService);

    await expect(service.shareMissing(MISSING)).resolves.toBe('shared');
    expect(nativeShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Perla'),
        url: expect.stringContaining(service.missingPathFor(MISSING)),
      }),
    );
  });

  it('copia la ficha individual de ayuda cuando no existe menú nativo', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const service = TestBed.inject(PublicRecordShareService);

    await expect(service.shareReport(REPORT)).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith(service.reportUrlFor(REPORT));
  });
});
