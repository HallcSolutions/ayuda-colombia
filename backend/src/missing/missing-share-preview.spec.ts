import {
  MissingStatus,
  MissingSubjectKind,
} from '../common/constants/app.constants';
import { MissingRecord } from '../common/interfaces/missing-record.interface';
import {
  missingIdFromSharePath,
  renderMissingSharePreview,
} from './missing-share-preview';

const ID = 'df431bcc-700c-4404-94ae-e68d85e38677';
const RECORD: MissingRecord = {
  id: ID,
  kind: MissingSubjectKind.ANIMAL,
  name: 'Perla',
  ageYears: null,
  description: 'Gata blanca con manchas atigradas, ojos grandes y expresivos.',
  department: 'Valle del Cauca',
  municipality: 'Cali',
  lastSeenPlace: 'Barrio La Merced',
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
  updatedAt: '2026-08-17T16:00:00.000Z',
};

const INDEX_HTML = `<!doctype html><html><head>
  <title>RedAyuda Colombia</title>
  <link rel="canonical" href="https://redayudacolombia.com/inicio" />
  <meta name="description" content="Portada genérica" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://redayudacolombia.com/inicio" />
  <meta property="og:title" content="RedAyuda Colombia" />
  <meta property="og:description" content="Portada genérica" />
  <meta property="og:image" content="https://redayudacolombia.com/default.jpg" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Portada" />
  <meta name="twitter:title" content="RedAyuda Colombia" />
  <meta name="twitter:description" content="Portada genérica" />
  <meta name="twitter:image" content="https://redayudacolombia.com/default.jpg" />
</head><body></body></html>`;

describe('vista previa al compartir desaparecidos', () => {
  it('extrae el UUID de enlaces limpios y de enlaces con texto pegado', () => {
    expect(missingIdFromSharePath(`/desaparecidos/perla-cali/${ID}`)).toBe(ID);
    expect(
      missingIdFromSharePath(
        `/desaparecidos/perla-cali/${ID}%20Ayudemos%20a%20encontrarla`,
      ),
    ).toBe(ID);
  });

  it('entrega nombre, señas y foto del animal en Open Graph y Twitter', () => {
    const html = renderMissingSharePreview(
      INDEX_HTML,
      RECORD,
      'https://redayudacolombia.com',
    );

    expect(html).toContain('Ayudemos a encontrar a Perla · Cali');
    expect(html).toContain('Gata blanca con manchas atigradas');
    expect(html).toContain('https://redayudacolombia.com/uploads/perla.png');
    expect(html).toContain(`desaparecidos/perla-cali/${ID}?v=`);
    expect(html).not.toContain('Portada genérica');
    expect(html).not.toContain('og:image:width');
  });
});
