import {
  ReliefPointStatus,
  ReliefPointType,
} from '../src/common/constants/app.constants';

export interface VerifiedReliefPoint {
  key: string;
  name: string;
  type: ReliefPointType;
  department: string;
  municipality: string;
  addressReference: string;
  latitude: number;
  longitude: number;
  contactName: string;
  contactPhone: string;
  schedule: string;
  status: ReliefPointStatus;
  verifiedAt: string;
  needs: string;
  sourceLabel: string;
  sourceUrl: string;
  caveat?: string;
}

const DIRECTORY = 'https://terremoto.com.co/collection-points';
const GUIDE =
  'https://elpais.com/america-colombia/2026-08-10/como-ayudar-a-las-personas-damnificadas-por-el-terremoto-en-colombia.html';
const INITIATIVES =
  'https://elpais.com/america-colombia/2026-08-12/la-columna-mas-aburrida-del-mundo.html';
const CALI_SHELTERS =
  'https://elpais.com/america-colombia/2026-08-13/entre-carpas-y-escombros-cali-ruega-para-que-la-lluvia-no-agrave-la-tragedia-del-terremoto.html';
const CALI_FOOD_BANK =
  'https://www.bancodealimentoscali.org/nuevo-contactenos/';

type VerifiedReliefPointInput = Omit<
  VerifiedReliefPoint,
  'type' | 'status' | 'verifiedAt'
> & {
  type?: ReliefPointType;
};

const verified = (point: VerifiedReliefPointInput): VerifiedReliefPoint => ({
  ...point,
  type: point.type ?? ReliefPointType.COLLECTION_CENTER,
  status: ReliefPointStatus.ACTIVE,
  verifiedAt: '2026-08-13',
});

/** Puntos activos corroborados para la emergencia del 10 de agosto de 2026. */
export const VERIFIED_RELIEF_POINTS: VerifiedReliefPoint[] = [
  verified({
    key: 'cartagena-bernardo-caraballo',
    name: 'Coliseo Cubierto Bernardo Caraballo',
    department: 'Bolívar',
    municipality: 'Cartagena',
    addressReference: 'Carrera 17 # 34-62, barrio Chambacú',
    latitude: 10.4254077,
    longitude: -75.5367595,
    contactName: 'Alcaldía de Cartagena',
    contactPhone: 'No publicado',
    schedule: 'Todos los días, 8:00 a 17:00',
    needs:
      'Agua, alimentos, aseo, colchones, sábanas, cobijas y alimento para animales.',
    sourceLabel: 'EL PAÍS — iniciativas nacionales',
    sourceUrl: INITIATIVES,
  }),
  verified({
    key: 'popayan-casa-moneda',
    name: 'Centro de Convenciones Casa de la Moneda',
    department: 'Cauca',
    municipality: 'Popayán',
    addressReference: 'Carrera 11, sector histórico Casa de la Moneda',
    latitude: 2.4440678,
    longitude: -76.6096921,
    contactName: 'Centro de Convenciones Casa de la Moneda',
    contactPhone: 'No publicado',
    schedule: 'Todos los días, 9:00 a 19:00',
    needs: 'Alimentos no perecederos, agua, kits de aseo y elementos médicos.',
    sourceLabel: 'Terremoto.com.co — verificado',
    sourceUrl: DIRECTORY,
  }),
  verified({
    key: 'cali-banco-alimentos',
    name: 'Fundación Arquidiocesana Banco de Alimentos',
    department: 'Valle del Cauca',
    municipality: 'Cali',
    addressReference: 'Calle 24 # 6-103, barrio San Nicolás',
    latitude: 3.4540001,
    longitude: -76.5203582,
    contactName: 'Banco de Alimentos de Cali',
    contactPhone: '315 226 5070',
    schedule: 'Lunes a viernes, 8:00 a 17:00',
    needs: 'Alimentos no perecederos, agua y artículos de primera necesidad.',
    sourceLabel: 'Banco de Alimentos de Cali — sitio oficial',
    sourceUrl: CALI_FOOD_BANK,
  }),
  verified({
    key: 'cali-albergue-chiminangos',
    name: 'Albergue comunitario Chiminangos II',
    type: ReliefPointType.SHELTER,
    department: 'Valle del Cauca',
    municipality: 'Cali',
    addressReference: 'Calle 62B con Carrera 1A6, sector 7, Chiminangos II',
    latitude: 3.4783816,
    longitude: -76.4933235,
    contactName: 'Comunidad de Chiminangos II',
    contactPhone: 'No publicado',
    schedule: 'Operación comunitaria continua; confirmar antes de ir',
    needs:
      'Censo institucional, alternativas de reubicación y evaluación estructural. No llevar más alimentos sin confirmar.',
    sourceLabel: 'EL PAÍS — reporte presencial en Chiminangos',
    sourceUrl: CALI_SHELTERS,
    caveat:
      'Albergue informal administrado por la comunidad; su ubicación y necesidades pueden cambiar.',
  }),
  verified({
    key: 'cali-albergue-canchas-panamericanas',
    name: 'Albergue Canchas Panamericanas',
    type: ReliefPointType.SHELTER,
    department: 'Valle del Cauca',
    municipality: 'Cali',
    addressReference: 'Calle 9 # 37-00, San Fernando',
    latitude: 3.42361,
    longitude: -76.53717,
    contactName: 'Alcaldía de Cali',
    contactPhone: 'Línea 195',
    schedule: 'Atención de emergencia; confirmar cupos en la Línea 195',
    needs:
      'Alojamiento temporal para familias damnificadas; confirmar cupos y necesidades antes de desplazarse.',
    sourceLabel: 'EL PAÍS — albergue dispuesto por la Alcaldía de Cali',
    sourceUrl: CALI_SHELTERS,
    caveat: 'No se confirmó recepción directa de donaciones en este lugar.',
  }),
  verified({
    key: 'bogota-casa-valle',
    name: 'Casa del Valle',
    department: 'Bogotá D.C.',
    municipality: 'Bogotá',
    addressReference: 'Calle 34 # 5-50, barrio La Merced',
    latitude: 4.6205568,
    longitude: -74.0654572,
    contactName: 'Gobernación del Valle del Cauca',
    contactPhone: 'No publicado',
    schedule: 'Horario por confirmar con la Gobernación',
    needs: 'Agua, cobijas, colchones, alimentos, aseo y primeros auxilios.',
    sourceLabel: 'Gobernación del Valle / directorio verificado',
    sourceUrl: 'https://x.com/GobValle/status/2086936778468893171',
  }),
  verified({
    key: 'bogota-unicentro',
    name: 'Centro Comercial Unicentro Bogotá',
    department: 'Bogotá D.C.',
    municipality: 'Bogotá',
    addressReference: 'Carrera 15 # 124-30',
    latitude: 4.7034551,
    longitude: -74.0421938,
    contactName: 'Unicentro Bogotá',
    contactPhone: 'No publicado',
    schedule: 'Todos los días, 9:00 a 17:00',
    needs:
      'Agua, alimentos, aseo, ropa de cama, ropa, linternas, pilas, primeros auxilios, EPP y ayuda animal.',
    sourceLabel: 'Alcaldía de Bogotá / directorio verificado',
    sourceUrl: DIRECTORY,
  }),
  verified({
    key: 'cali-antigua-licorera',
    name: 'Antigua Licorera del Valle',
    department: 'Valle del Cauca',
    municipality: 'Cali',
    addressReference: 'Carrera 1 # 26-85',
    latitude: 3.4610172,
    longitude: -76.5198802,
    contactName: 'Gobernación del Valle del Cauca',
    contactPhone: 'No publicado',
    schedule: 'Horario por confirmar con la Gobernación',
    needs:
      'Alimentos, colchones, cobijas, aseo, EPP, linternas, carpas, toallas y alimento para animales.',
    sourceLabel: 'Gobernación del Valle / directorio verificado',
    sourceUrl: 'https://x.com/GobValle/status/2086948308153405790',
  }),
  verified({
    key: 'bogota-tadeo',
    name: 'Universidad Jorge Tadeo Lozano',
    department: 'Bogotá D.C.',
    municipality: 'Bogotá',
    addressReference: 'Carrera 4 # 22-61',
    latitude: 4.606567,
    longitude: -74.067801,
    contactName: 'Universidad Jorge Tadeo Lozano',
    contactPhone: 'No publicado',
    schedule: 'Lunes a viernes 8:00 a 18:00; sábado 8:00 a 12:00',
    needs: 'Agua, cobijas, colchones, alimentos, aseo y primeros auxilios.',
    sourceLabel: 'IDIGER / EL PAÍS',
    sourceUrl: 'https://x.com/IDIGER/status/2086971113758712252',
  }),
  verified({
    key: 'medellin-banco-alimentos',
    name: 'Banco Arquidiocesano de Alimentos de Medellín',
    department: 'Antioquia',
    municipality: 'Medellín',
    addressReference: 'Carrera 52 # 30A-97',
    latitude: 6.2336987,
    longitude: -75.5767209,
    contactName: 'Fundación Banco Arquidiocesano de Alimentos',
    contactPhone: '(604) 448 3888',
    schedule: 'Horario por confirmar con la fundación',
    needs:
      'Agua, alimentos no perecederos, aseo, colchones, pañales y toallas.',
    sourceLabel: 'Banco de Alimentos / directorio verificado',
    sourceUrl: 'https://bancodealimentos.co/site/donaciones/',
  }),
  verified({
    key: 'barranquilla-centro-acopio',
    name: 'Centro de Acopio Distrital de Barranquilla',
    department: 'Atlántico',
    municipality: 'Barranquilla',
    addressReference: 'Carrera 43 # 6-120',
    latitude: 10.9822319,
    longitude: -74.7708512,
    contactName: 'Alcaldía de Barranquilla',
    contactPhone: 'No publicado',
    schedule: 'Horario por confirmar con la Alcaldía',
    needs:
      'Alimentos, agua, insumos médicos y de aseo, productos para bebés, ropa y colchones.',
    sourceLabel: 'Terremoto.com.co — verificado',
    sourceUrl: DIRECTORY,
    caveat: 'Confirmar vigencia y horario antes de desplazarse.',
  }),
  verified({
    key: 'cali-escuela-deporte',
    name: 'Escuela Nacional del Deporte',
    department: 'Valle del Cauca',
    municipality: 'Cali',
    addressReference: 'Calle 9 # 34-01',
    latitude: 3.4263251,
    longitude: -76.5370157,
    contactName: 'Escuela Nacional del Deporte',
    contactPhone: '(602) 554 0404',
    schedule: 'Horario por confirmar con la institución',
    needs:
      'Agua (prioridad), alimentos, colchones, cobijas, aseo, EPP, herramientas, linternas, toallas y alimento animal.',
    sourceLabel: 'Escuela Nacional del Deporte / directorio verificado',
    sourceUrl: 'https://endeporte.edu.co/galeria/167/informacion-general/',
  }),
  verified({
    key: 'bogota-palacio-deportes',
    name: 'Palacio de los Deportes',
    department: 'Bogotá D.C.',
    municipality: 'Bogotá',
    addressReference: 'Calle 63 # 59A-06',
    latitude: 4.6554178,
    longitude: -74.0841157,
    contactName: 'Alcaldía Mayor de Bogotá',
    contactPhone: 'Línea 195',
    schedule: 'Horario por confirmar en la Línea 195',
    needs: 'Agua, alimentos no perecederos, aseo, cobijas y primeros auxilios.',
    sourceLabel: 'Alcaldía de Bogotá / EL PAÍS',
    sourceUrl: GUIDE,
  }),
  verified({
    key: 'bogota-cruz-roja-bodega',
    name: 'Bodega Cruz Roja Bogotá',
    department: 'Bogotá D.C.',
    municipality: 'Bogotá',
    addressReference: 'Diagonal 79B # 62-53',
    latitude: 4.6796948,
    longitude: -74.0773444,
    contactName: 'Cruz Roja Colombiana',
    contactPhone: '(601) 746 0909',
    schedule: 'Horario por confirmar con la Cruz Roja',
    needs: 'Agua, alimentos no perecederos, aseo, cobijas y primeros auxilios.',
    sourceLabel: 'Cruz Roja / EL PAÍS',
    sourceUrl: GUIDE,
  }),
  verified({
    key: 'bogota-cruz-roja-administrativa',
    name: 'Sede Administrativa Cruz Roja Bogotá',
    department: 'Bogotá D.C.',
    municipality: 'Bogotá',
    addressReference: 'Carrera 24 # 73-38',
    latitude: 4.6641429,
    longitude: -74.0662785,
    contactName: 'Cruz Roja Colombiana',
    contactPhone: '(601) 746 0909',
    schedule: '24 horas',
    needs: 'Agua, alimentos no perecederos, aseo, cobijas y primeros auxilios.',
    sourceLabel: 'Cruz Roja / EL PAÍS',
    sourceUrl: INITIATIVES,
  }),
  verified({
    key: 'bogota-cruz-roja-esmeralda',
    name: 'Centro de Salvamento Acuático Cruz Roja',
    department: 'Bogotá D.C.',
    municipality: 'Bogotá',
    addressReference: 'Avenida La Esmeralda # 63-81, Barrios Unidos',
    latitude: 4.66615,
    longitude: -74.0860427,
    contactName: 'Cruz Roja Colombiana',
    contactPhone: '(601) 746 0909',
    schedule: 'Horario por confirmar con la Cruz Roja',
    needs: 'Agua, alimentos no perecederos, aseo, cobijas y primeros auxilios.',
    sourceLabel: 'Cruz Roja / EL PAÍS',
    sourceUrl: GUIDE,
  }),
  verified({
    key: 'bogota-samu-sur',
    name: 'SAMU Sur',
    department: 'Bogotá D.C.',
    municipality: 'Bogotá',
    addressReference: 'Avenida Carrera 68 # 31-41 Sur',
    latitude: 4.6072495,
    longitude: -74.1312629,
    contactName: 'Alcaldía Mayor de Bogotá',
    contactPhone: 'Línea 195',
    schedule: 'Horario por confirmar en la Línea 195',
    needs: 'Agua, alimentos no perecederos, aseo, cobijas y primeros auxilios.',
    sourceLabel: 'Alcaldía de Bogotá / EL PAÍS',
    sourceUrl: GUIDE,
  }),
  verified({
    key: 'bogota-casa-memoria-usaquen',
    name: 'Casa de la Memoria de Usaquén',
    department: 'Bogotá D.C.',
    municipality: 'Bogotá',
    addressReference: 'Calle 161A # 7F-55, San Cristóbal Norte',
    latitude: 4.7407,
    longitude: -74.0272,
    contactName: 'Alcaldía Local de Usaquén',
    contactPhone: 'Línea 195',
    schedule: 'Horario por confirmar en la Línea 195',
    needs: 'Agua, alimentos no perecederos, aseo, cobijas y primeros auxilios.',
    sourceLabel: 'Alcaldía de Bogotá / EL PAÍS',
    sourceUrl: INITIATIVES,
  }),
  verified({
    key: 'cali-jairo-varela',
    name: 'Plazoleta Jairo Varela',
    department: 'Valle del Cauca',
    municipality: 'Cali',
    addressReference: 'Avenida 2 Norte # 10N-70',
    latitude: 3.4550312,
    longitude: -76.534835,
    contactName: 'Alcaldía de Cali',
    contactPhone: 'Línea 195',
    schedule: 'Horario por confirmar en la Línea 195',
    needs:
      'Guantes de construcción, gafas de seguridad, cascos, colchones y agua.',
    sourceLabel: 'Alcaldía de Cali / EL PAÍS',
    sourceUrl: INITIATIVES,
  }),
];

const pereiraPoints = [
  [
    'pereira-cafe-consota',
    'CAFE Consota',
    'Manzanas 7 y 8, Villa Consota, Cuba',
    4.8022173,
    -75.7256679,
  ],
  [
    'pereira-cafe-perla',
    'CAFE Perla del Otún',
    'Diagonal a la iglesia de los 2.500 Lotes, Cuba',
    4.8030777,
    -75.7439278,
  ],
  [
    'pereira-cafe-remanso',
    'CAFE El Remanso',
    'Avenida principal barrio El Remanso, junto al centro de salud',
    4.7959136,
    -75.6670807,
  ],
  [
    'pereira-cafe-kennedy',
    'CAFE Kennedy',
    'Parque principal de Kennedy, al lado de la cancha',
    4.808362,
    -75.6720991,
  ],
  [
    'pereira-cafe-ormaza',
    'CAFE Ormaza',
    'Calle 3 Bis # 5-38, Avenida del Río',
    4.8075179,
    -75.6815428,
  ],
  [
    'pereira-cafe-san-nicolas',
    'CAFE San Nicolás',
    'Carrera 14 Bis # 28-38, antigua estación de Policía',
    4.8076591,
    -75.7038626,
  ],
  [
    'pereira-cafe-comuna',
    'CAFE Comuna del Café',
    'Carrera 3 con Calle 59A, sector A Parque Industrial',
    4.8226461,
    -75.7278004,
  ],
] as const;

VERIFIED_RELIEF_POINTS.push(
  ...pereiraPoints.map(([key, name, addressReference, latitude, longitude]) =>
    verified({
      key,
      name,
      addressReference,
      latitude,
      longitude,
      department: 'Risaralda',
      municipality: 'Pereira',
      contactName: 'Alcaldía de Pereira',
      contactPhone: '(606) 324 8000',
      schedule: 'Horario por confirmar con la Alcaldía de Pereira',
      needs:
        'Ropa para todas las edades, recipientes desechables, aseo, cobijas y colchones.',
      sourceLabel: 'Alcaldía de Pereira / EL PAÍS',
      sourceUrl: INITIATIVES,
    }),
  ),
);
