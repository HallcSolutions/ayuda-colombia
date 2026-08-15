import {
  ReliefPointStatus,
  ReliefPointType,
  SupplyCategory,
  UrgencyLevel,
} from '../src/common/constants/app.constants';
import type { VerifiedReliefPoint } from './verified-relief-points';

const UPDATED_RESOURCES = 'https://ayudaterremotocolombia.com/recursos';
const CALI_HEALTH =
  'https://www.cali.gov.co/publicaciones/193618/instalan-puntos-de-atencion-en-salud-en-las-zonas-de-alto-impacto-tras-el-sismo/';

type ServicePointInput = Omit<
  VerifiedReliefPoint,
  'status' | 'verifiedAt' | 'needs' | 'sourceLabel' | 'sourceUrl'
> & {
  needs?: string;
  sourceLabel?: string;
  sourceUrl?: string;
};

const servicePoint = (point: ServicePointInput): VerifiedReliefPoint => ({
  ...point,
  status: ReliefPointStatus.ACTIVE,
  verifiedAt: '2026-08-15',
  needs: point.needs ?? '',
  sourceLabel:
    point.sourceLabel ?? 'Ayuda Terremoto Colombia — directorio actualizado',
  sourceUrl: point.sourceUrl ?? UPDATED_RESOURCES,
});

/** Servicios y puntos vigentes añadidos al directorio después de la carga inicial. */
export const VERIFIED_RELIEF_SERVICES: VerifiedReliefPoint[] = [
  servicePoint({
    key: 'medellin-fundacion-saciar',
    name: 'Fundación Saciar — Banco de Alimentos',
    type: ReliefPointType.COLLECTION_CENTER,
    department: 'Antioquia',
    municipality: 'Medellín',
    addressReference: 'Carrera 50 # 25-261',
    latitude: 6.229523,
    longitude: -75.5762833,
    contactName: 'Fundación Saciar',
    contactPhone: '(604) 235 1088',
    schedule: 'Confirmar horario y prioridades con la fundación',
    caveat:
      'Banco de alimentos incluido en el directorio actual de ayuda. Confirmar directamente qué recibe para esta emergencia antes de desplazarse.',
  }),
  servicePoint({
    key: 'manizales-coliseo-mayor',
    name: 'Albergue Coliseo Mayor Jorge Arango Uribe',
    type: ReliefPointType.SHELTER,
    department: 'Caldas',
    municipality: 'Manizales',
    addressReference: 'Carrera 24 # 62-70, sector Palogrande',
    latitude: 5.057992,
    longitude: -75.488428,
    contactName: 'Alcaldía de Manizales — UGR',
    contactPhone: '119',
    schedule: 'Atención de emergencia; confirmar cupos en la línea 119',
    sourceLabel: 'Alcaldía de Manizales — publicación oficial',
    sourceUrl:
      'https://centrodeinformacion.manizales.gov.co/manizales-mantienen-su-respuesta-institucional-y-consolida-acciones-en-la-atencion-tras-el-sismo/',
    caveat:
      'La Alcaldía reportó 287 personas y 31 mascotas albergadas. Confirmar capacidad antes de ir.',
  }),
  servicePoint({
    key: 'manizales-coliseo-menor',
    name: 'Albergue Coliseo Menor Ramón Marín Vargas',
    type: ReliefPointType.SHELTER,
    department: 'Caldas',
    municipality: 'Manizales',
    addressReference: 'Carrera 25 # 64-28, sector Palogrande',
    latitude: 5.0559021,
    longitude: -75.4886316,
    contactName: 'Alcaldía de Manizales — UGR',
    contactPhone: '119',
    schedule: 'Atención de emergencia; confirmar cupos en la línea 119',
    sourceLabel: 'Alcaldía de Manizales — publicación oficial',
    sourceUrl:
      'https://centrodeinformacion.manizales.gov.co/6-personas-fallecidas-mas-de-2-mil-damnificados-y-mas-de-550-revisiones-estructurales/',
    caveat:
      'La Alcaldía lo habilitó para ampliar la capacidad de alojamiento después del sismo. Confirmar ocupación antes de ir.',
  }),
  servicePoint({
    key: 'manizales-banco-alimentos',
    name: 'Banco Arquidiocesano de Alimentos de Manizales',
    type: ReliefPointType.COLLECTION_CENTER,
    department: 'Caldas',
    municipality: 'Manizales',
    addressReference: 'Calle 49 # 27A-85',
    latitude: 5.0602036,
    longitude: -75.5009975,
    contactName: 'Banco Arquidiocesano de Alimentos',
    contactPhone: '310 418 4472',
    schedule: 'Confirmar horario y prioridades por teléfono',
    needs:
      'Se publicó recepción de alimentos no perecederos para la emergencia. Antes de desplazarse, confirmar por teléfono el horario y si reciben también artículos de aseo, hogar o vestuario.',
    alertTitle: 'Recepción de alimentos no perecederos',
    alertCategory: SupplyCategory.FOOD,
    alertSeverity: UrgencyLevel.MEDIUM,
    alertCreatedBy: 'Red Ayuda Colombia',
    sourceLabel: 'Banco de Alimentos de Manizales — sitio oficial',
    sourceUrl: 'https://bancodealimentosmanizales.org/',
  }),
  servicePoint({
    key: 'dosquebradas-caritas',
    name: 'Banco de Alimentos Cáritas Pereira',
    type: ReliefPointType.COLLECTION_CENTER,
    department: 'Risaralda',
    municipality: 'Dosquebradas',
    addressReference: 'Transversal 5 # 6-30, Calle de las Aromas, La Badea',
    latitude: 4.8230454,
    longitude: -75.6948269,
    contactName: 'Cáritas Diocesana de Pereira',
    contactPhone: '(606) 315 4138',
    schedule: 'Confirmar horario y prioridades por teléfono',
    needs:
      'El banco institucional recibe alimentos y bienes aptos para redistribución. Confirmar directamente las prioridades actuales, la vida útil exigida y el horario antes de llevar donaciones.',
    alertTitle: 'Recepción de donaciones',
    alertCategory: SupplyCategory.FOOD,
    alertSeverity: UrgencyLevel.MEDIUM,
    alertCreatedBy: 'Red Ayuda Colombia',
    sourceLabel: 'Cáritas Pereira — sitio institucional',
    sourceUrl: 'https://www.caritaspereira.org/banco-de-alimentos/',
    caveat: 'Confirmar el acceso a la sede antes de desplazarse.',
  }),
];

const pereiraShelters = [
  [
    'pereira-albergue-rafael-cuartas',
    'Albergue Coliseo Mayor Rafael Cuartas Gaviria',
    'Carrera 8 # 36-05',
    4.815114114,
    -75.708999003,
  ],
  [
    'pereira-albergue-coliseo-menor',
    'Albergue Coliseo Menor de Pereira',
    'Calle 19 # 4-01',
    4.8174583,
    -75.6940909,
  ],
  [
    'pereira-albergue-estadio-mora',
    'Albergue Estadio Alberto Mora Mora',
    'Avenida Santander, sector Oriente',
    4.8069886,
    -75.6708803,
  ],
  [
    'pereira-albergue-parque-oso',
    'Albergue Parque El Oso',
    'Parque El Oso, comuna Perla del Otún',
    4.798927,
    -75.7327124,
  ],
  [
    'pereira-albergue-parque-vergel',
    'Albergue Parque El Vergel',
    'Parque El Vergel, entre Boston y El Poblado',
    4.799831946,
    -75.70118472,
  ],
  [
    'pereira-albergue-parque-olaya',
    'Albergue Parque Olaya Herrera',
    'Calle 21 con Carrera 13, Parque Olaya Herrera',
    4.809428,
    -75.6962833,
  ],
  [
    'pereira-albergue-ferias-cerritos',
    'Albergue Plaza de Ferias Cerritos',
    'Plaza de Ferias, sector Cerritos',
    4.8066494,
    -75.8407215,
  ],
] as const;

VERIFIED_RELIEF_SERVICES.push(
  ...pereiraShelters.map(([key, name, addressReference, latitude, longitude]) =>
    servicePoint({
      key,
      name,
      type: ReliefPointType.SHELTER,
      department: 'Risaralda',
      municipality: 'Pereira',
      addressReference,
      latitude,
      longitude,
      contactName: 'Alcaldía de Pereira',
      contactPhone: '(606) 324 8000',
      schedule: 'Atención de emergencia; confirmar cupos antes de ir',
      caveat:
        'Publicado con alimentación y atención para personas afectadas. Confirmar capacidad y acceso con la Alcaldía antes de ir.',
    }),
  ),
  servicePoint({
    key: 'cali-centro-bienestar-animal',
    name: 'Centro de Bienestar Animal de Cali',
    type: ReliefPointType.VETERINARY,
    department: 'Valle del Cauca',
    municipality: 'Cali',
    addressReference: 'Carrera 56 # 7 Oeste-315, barrio Bella Suiza',
    latitude: 3.4101018,
    longitude: -76.5618948,
    contactName: 'UAEPA — Centro de Bienestar Animal de Cali',
    contactPhone: '3182750101',
    schedule: 'Atención lun-vie 7:30-12:30 y 13:30-17:30; urgencias 24/7',
    sourceLabel: 'Alcaldía de Cali — sitio oficial',
    sourceUrl:
      'https://www.cali.gov.co/proteccionanimal/publicaciones/178255/localizacion-fisica-dias-y-horarios-de-atencion/',
    additionalSourceUrls: [
      'https://www.cali.gov.co/dagma/publicaciones/176719/asi-es-el-protocolo-de-ingreso-al-centro-de-bienestar-animal-de-cali/',
      'https://www.instagram.com/proteccionanimalcali/',
    ],
    caveat:
      'Hospital, refugio, urgencias y adopción. Para abandono o maltrato, reporte primero al WhatsApp institucional; no lleve el animal directamente.',
  }),
  servicePoint({
    key: 'cali-petronio-coliseo-pueblo',
    name: 'Ciudadela Petronio Álvarez — Coliseo del Pueblo',
    type: ReliefPointType.COLLECTION_CENTER,
    department: 'Valle del Cauca',
    municipality: 'Cali',
    addressReference: 'Carrera 52 # 2-51, Unidad Deportiva Alberto Galindo',
    latitude: 3.4133855,
    longitude: -76.5517346,
    contactName: 'Alcaldía de Cali',
    contactPhone: 'Línea 195',
    schedule: 'Confirmar horario y vigencia en la Línea 195',
    caveat:
      'Punto municipal autorizado de recepción. Confirmar horario y acceso antes de llevar ayudas porque el recinto tiene programación masiva.',
  }),
  servicePoint({
    key: 'medellin-cba-la-perla',
    name: 'Centro de Bienestar Animal La Perla',
    type: ReliefPointType.VETERINARY,
    department: 'Antioquia',
    municipality: 'Medellín',
    addressReference: 'Carrera 112 # 12-01, Belén Altavista',
    latitude: 6.217471,
    longitude: -75.636696,
    contactName: 'Alcaldía de Medellín — CBA La Perla',
    contactPhone: '6043855560',
    schedule: 'Lun-vie 7:00-15:00; sáb, dom y festivos 8:00-14:00',
    sourceLabel: 'Alcaldía de Medellín — sitio oficial',
    sourceUrl:
      'https://www.medellin.gov.co/es/secretaria-medio-ambiente/proteccion-y-bienestar-animal/bienestar-animal-del-distrito-de-medellin/centro-de-bienestar-animal-la-perla/',
    caveat:
      'Rescate, clínica, hospitalización y alojamiento. Para animales sin propietario en alta vulnerabilidad, reporte primero al 123; no es entrega libre.',
  }),
  servicePoint({
    key: 'barranquilla-cba',
    name: 'Centro de Bienestar Animal de Barranquilla',
    type: ReliefPointType.VETERINARY,
    department: 'Atlántico',
    municipality: 'Barranquilla',
    addressReference: 'Vía 11 # 4-413, corregimiento Juan Mina',
    latitude: 10.9576409,
    longitude: -74.894397,
    contactName: 'Alcaldía de Barranquilla — Bienestar Animal',
    contactPhone: '3122195227',
    schedule: 'Urgencias 24/7; visitas 8:00-11:00 y 14:00-16:00',
    sourceLabel: 'Alcaldía de Barranquilla — sitio oficial',
    sourceUrl:
      'https://barranquilla.gov.co/secgobierno/programa-de-bienestar-animal',
    caveat:
      'Atiende animales de calle o abandono y la población definida por el programa. Contactar antes del traslado por la Línea 195 o al 605 401 0205.',
  }),
  servicePoint({
    key: 'bogota-uca-idpyba',
    name: 'Unidad de Cuidado Animal (UCA) - IDPYBA',
    type: ReliefPointType.VETERINARY,
    department: 'Bogotá D.C.',
    municipality: 'Bogotá',
    addressReference: 'Carrera 106A # 67-02, barrio El Muelle, Engativá',
    latitude: 4.7013429,
    longitude: -74.1264772,
    contactName: 'IDPYBA — atención ciudadana',
    contactPhone: '6016477117',
    schedule:
      'Mar-vie 10:00-15:00; sáb, dom y festivos 10:00-15:00; lunes cerrado',
    sourceLabel: 'IDPYBA — sitio oficial',
    sourceUrl:
      'https://animalesbog.gov.co/index.php/nosotros/unidad-de-cuidado-animal',
    caveat:
      'No es entrega directa. Para perros o gatos de calle o abandonados en urgencia vital, reporte al 123; el equipo valora y traslada.',
  }),
);

const caliMedicalPosts = [
  ['alameda', 'Alameda', 'Sector Alameda', 3.432644, -76.5358173],
  [
    'calle-4-carrera-56',
    'Calle 4 con Carrera 56',
    'Intersección Calle 4 con Carrera 56 (Avenida Guadalupe)',
    3.4091875,
    -76.5484375,
  ],
  [
    'calle-5-carrera-44',
    'Calle 5 con Carrera 44',
    'Intersección Calle 5 con Carrera 44',
    3.420138,
    -76.5483338,
  ],
  [
    'calle-9-carrera-44',
    'Calle 9 con Carrera 44',
    'Intersección Calle 9 con Carrera 44',
    3.4166916,
    -76.5400556,
  ],
  ['capri', 'Capri', 'Sector Capri', 3.3884783, -76.5415978],
  [
    'carrera-64-calle-4',
    'Carrera 64 con Calle 4',
    'Intersección Carrera 64 con Calle 4',
    3.4005024,
    -76.5472486,
  ],
  [
    'diamante-beisbol',
    'Diamante de Béisbol',
    'Diamante de Béisbol',
    3.4216563,
    -76.5365747,
  ],
  [
    'nueva-tequendama',
    'Nueva Tequendama',
    'Sector Nueva Tequendama',
    3.4137011,
    -76.5437655,
  ],
  [
    'palmetto',
    'Palmetto',
    'Centro Comercial Palmetto Plaza',
    3.4128807,
    -76.5406049,
  ],
  ['pampalinda', 'Pampalinda', 'Sector Pampalinda', 3.4051589, -76.5481006],
  [
    'roosevelt-carrera-39',
    'Roosevelt con Carrera 39',
    'Avenida Roosevelt con Carrera 39',
    3.4219718,
    -76.5418787,
  ],
] as const;

VERIFIED_RELIEF_SERVICES.push(
  ...caliMedicalPosts.map(
    ([key, name, addressReference, latitude, longitude]) =>
      servicePoint({
        key: `cali-medico-${key}`,
        name: `Puesto médico de emergencia — ${name}`,
        type: ReliefPointType.MEDICAL_POST,
        department: 'Valle del Cauca',
        municipality: 'Cali',
        addressReference,
        latitude,
        longitude,
        contactName: 'Secretaría de Salud Pública de Cali',
        contactPhone: '195',
        schedule:
          'Emergencia; confirme vigencia antes de desplazarse en la Línea 195',
        sourceLabel: 'Alcaldía de Cali — publicación oficial del 11-08-2026',
        sourceUrl: CALI_HEALTH,
        caveat:
          'Atención prehospitalaria de primer nivel y manejo psicosocial. No es un punto de donaciones; confirme vigencia antes de desplazarse.',
      }),
  ),
);
