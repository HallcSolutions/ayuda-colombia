import { TestBed } from '@angular/core/testing';
import { ReliefPointStatus, ReliefPointType } from '../constants/app.constants';
import { ReliefPoint } from '../models/relief-point.model';
import { ReliefPointShareService } from './relief-point-share.service';

const POINT: ReliefPoint = {
  id: '1371f22f-6b87-4a9c-aad6-2f0994387f9a',
  name: 'Albergue comunitario Chiminangos II',
  type: ReliefPointType.SHELTER,
  department: 'Valle del Cauca',
  municipality: 'Cali',
  latitude: 3.4783816,
  longitude: -76.4933235,
  addressReference: 'Calle 62B con Carrera 1A6',
  contactName: 'Comunidad de Chiminangos II',
  contactPhone: 'No publicado',
  schedule: 'Operación comunitaria continua',
  dailyMealCapacity: null,
  status: ReliefPointStatus.ACTIVE,
  notes: '',
  verifiedBy: 'Fotografía actual tomada en el sitio',
  verifiedAt: '2026-08-17T01:35:11.221Z',
  createdAt: '2026-08-13T22:08:53.415Z',
  updatedAt: '2026-08-17T01:35:11.219Z',
};

describe('ReliefPointShareService', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  });

  it('crea un enlace legible con el nombre, la ciudad y el identificador estable', () => {
    const service = TestBed.inject(ReliefPointShareService);

    expect(service.pathFor(POINT)).toBe(
      '/puntos/albergue-comunitario-chiminangos-ii-cali/1371f22f-6b87-4a9c-aad6-2f0994387f9a',
    );
    expect(service.urlFor(POINT)).toContain(service.pathFor(POINT));
  });

  it('hace explícito cuando el lugar es un punto de acopio', () => {
    const service = TestBed.inject(ReliefPointShareService);
    const collectionPoint = {
      ...POINT,
      name: 'Coliseo Bernardo Caraballo',
      type: ReliefPointType.COLLECTION_CENTER,
      municipality: 'Cartagena',
    };

    expect(service.pathFor(collectionPoint)).toContain(
      '/puntos/punto-de-acopio-coliseo-bernardo-caraballo-cartagena/',
    );
  });

  it('abre el menú nativo con el nombre y el enlace directo en celular', async () => {
    const nativeShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: nativeShare });
    const service = TestBed.inject(ReliefPointShareService);

    await expect(service.share(POINT)).resolves.toBe('shared');
    expect(nativeShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: POINT.name,
        url: expect.stringContaining(service.pathFor(POINT)),
      }),
    );
    expect(nativeShare.mock.calls[0][0]).not.toHaveProperty('text');
  });

  it('copia el mismo enlace directo cuando el equipo no tiene menú para compartir', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const service = TestBed.inject(ReliefPointShareService);

    await expect(service.share(POINT)).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith(service.urlFor(POINT));
  });
});
