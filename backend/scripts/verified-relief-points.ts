import {
  ReliefPointStatus,
  ReliefPointType,
  SupplyCategory,
  UrgencyLevel,
} from '../src/common/constants/app.constants';
import { VERIFIED_RELIEF_SERVICES } from './verified-relief-services';

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
  additionalSourceUrls?: string[];
  alertTitle?: string;
  alertCategory?: SupplyCategory;
  alertSeverity?: UrgencyLevel;
  alertCreatedBy?: string;
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
const LUIS_DIAZ_POINT =
  'https://www.tropicanafm.com/2026/luis-diaz-y-gera-ponce-enviaran-ayuda-humanitaria-para-apoyar-a-las-victimas-del-terremoto-todo-suma-473397.html';
const UPDATED_RESOURCES = 'https://ayudaterremotocolombia.com/recursos';

type VerifiedReliefPointInput = Omit<
  VerifiedReliefPoint,
  'type' | 'status' | 'verifiedAt'
> & {
  type?: ReliefPointType;
  status?: ReliefPointStatus;
  verifiedAt?: string;
};

const verified = (point: VerifiedReliefPointInput): VerifiedReliefPoint => ({
  ...point,
  type: point.type ?? ReliefPointType.COLLECTION_CENTER,
  status: point.status ?? ReliefPointStatus.ACTIVE,
  verifiedAt: point.verifiedAt ?? '2026-08-13',
});

/** Directorio corroborado para la emergencia del 10 de agosto de 2026. */
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
    needs:
      'Alimentos no perecederos, elementos de aseo, mantas, linternas, herramientas, elementos de protección y alimentos para animales.',
    sourceLabel: 'Gobernación del Valle — publicación oficial',
    sourceUrl: 'https://x.com/GobValle/status/2086936778468893171',
    alertTitle: 'Necesidades verificadas 15 de agosto',
    verifiedAt: '2026-08-15',
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
      'Alimentos no perecederos, colchonetas, mantas, kits de aseo, elementos de protección, linternas, carpas, toallas y alimentos para perros y gatos.',
    sourceLabel: 'Gobernación del Valle — publicación oficial',
    sourceUrl: 'https://x.com/GobValle/status/2086948308153405790',
    verifiedAt: '2026-08-15',
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
    sourceLabel: 'EL PAÍS — iniciativas nacionales',
    sourceUrl: INITIATIVES,
    verifiedAt: '2026-08-15',
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
    schedule: 'Cerrado; la recepción municipal se trasladó a Petronio Álvarez',
    status: ReliefPointStatus.CLOSED,
    needs: '',
    sourceLabel: 'Ayuda Terremoto Colombia — directorio actualizado',
    sourceUrl: UPDATED_RESOURCES,
    caveat:
      'Ya no recibe donaciones. El punto municipal autorizado vigente es Ciudadela Petronio Álvarez — Coliseo del Pueblo.',
    verifiedAt: '2026-08-15',
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

const nationalCampaignPoints = [
  [
    'yumbo-colombia-un-corazon',
    'Punto Colombia: un solo corazón — Yumbo',
    'Valle del Cauca',
    'Yumbo',
    'Carrera 30 # 10-90, sector Arroyo Hondo',
    3.4930688,
    -76.4882663,
  ],
  [
    'ibague-banco-alimentos-arquidiocesis',
    'Banco de Alimentos de la Arquidiócesis de Ibagué',
    'Tolima',
    'Ibagué',
    'Carrera 4 # 23-42',
    4.5099882,
    -75.2990826,
  ],
  [
    'pasto-preicfes-montilla',
    'Punto Colombia: un solo corazón — Pasto',
    'Nariño',
    'Pasto',
    'Calle 17 # 27-59, antiguo PreIcfes Montilla',
    1.2255768,
    -77.2888472,
  ],
  [
    'florencia-colombia-un-corazon',
    'Punto Colombia: un solo corazón — Florencia',
    'Caquetá',
    'Florencia',
    'Carrera 10A # 7-04',
    1.6070934,
    -75.5995969,
  ],
  [
    'acacias-colombia-un-corazon',
    'Punto Colombia: un solo corazón — Acacías',
    'Meta',
    'Acacías',
    'Calle 15 # 16-43',
    3.9922299,
    -73.7824059,
  ],
  [
    'sincelejo-colombia-un-corazon',
    'Punto Colombia: un solo corazón — Sincelejo',
    'Sucre',
    'Sincelejo',
    'Calle 19 # 21-41',
    9.306897,
    -75.3885873,
  ],
  [
    'caqueza-deportivos-willys',
    'Deportivos Willys — punto de acopio',
    'Cundinamarca',
    'Cáqueza',
    'Calle 4, local Deportivos Willys',
    4.3979257,
    -73.9447049,
  ],
  [
    'chia-carrera-9',
    'Punto Colombia: un solo corazón — Chía',
    'Cundinamarca',
    'Chía',
    'Carrera 9 # 12-41',
    4.85304,
    -74.0616952,
  ],
] as const;

VERIFIED_RELIEF_POINTS.push(
  ...nationalCampaignPoints.map(
    ([
      key,
      name,
      department,
      municipality,
      addressReference,
      latitude,
      longitude,
    ]) =>
      verified({
        key,
        name,
        department,
        municipality,
        addressReference,
        latitude,
        longitude,
        contactName: 'Campaña Colombia: un solo corazón',
        contactPhone: 'No publicado',
        schedule: 'Horario por confirmar en el canal oficial de la campaña',
        needs:
          'Agua, alimentos no perecederos, ropa limpia, artículos de aseo y primeros auxilios.',
        sourceLabel: 'Colombia: un solo corazón / EL PAÍS',
        sourceUrl: INITIATIVES,
        caveat:
          'La campaña confirmó la ciudad; la dirección fue contrastada con el directorio ciudadano. Confirmar horario antes de ir.',
      }),
  ),
);

const santanderPoints = [
  [
    'santander-gobernacion',
    'Gobernación de Santander — punto de acopio',
    'Bucaramanga',
    'Calle 37 # 10-30, Palacio Amarillo',
    7.1178281,
    -73.1308882,
  ],
  [
    'santander-gestion-riesgo-floridablanca',
    'CEGIRD Oriente — Gestión del Riesgo',
    'Floridablanca',
    'Calle 5 # 3-18',
    7.0826717,
    -73.1034606,
  ],
  [
    'santander-loteria',
    'Lotería de Santander — punto de acopio',
    'Bucaramanga',
    'Calle 36 # 21-16',
    7.1192,
    -73.1204,
  ],
  [
    'santander-inder',
    'INDERSANTANDER — punto de acopio',
    'Bucaramanga',
    'Unidad Deportiva Alfonso López, Carrera 30 # 14-45',
    7.1350041,
    -73.1172165,
  ],
  [
    'santander-idesan',
    'IDESAN — punto de acopio',
    'Bucaramanga',
    'Calle 48 # 27A-48',
    7.1112,
    -73.1164,
  ],
] as const;

VERIFIED_RELIEF_POINTS.push(
  ...santanderPoints.map(
    ([key, name, municipality, addressReference, latitude, longitude]) =>
      verified({
        key,
        name,
        department: 'Santander',
        municipality,
        addressReference,
        latitude,
        longitude,
        contactName: 'Gobernación de Santander',
        contactPhone: 'No publicado',
        schedule: 'Todos los días, 8:00 a 17:00; confirmar antes de ir',
        needs:
          'Agua, alimentos no perecederos, elementos de aseo, cobijas y artículos de primera necesidad.',
        sourceLabel: 'Gobernación de Santander / EL PAÍS',
        sourceUrl: INITIATIVES,
      }),
  ),
);

VERIFIED_RELIEF_POINTS.push(
  verified({
    key: 'bogota-samu-norte',
    name: 'SAMU Norte Cruz Roja',
    department: 'Bogotá D.C.',
    municipality: 'Bogotá',
    addressReference: 'Carrera 7B Bis # 132-31, acceso por Calle 134',
    latitude: 4.7325756,
    longitude: -74.0252056,
    contactName: 'Cruz Roja Colombiana',
    contactPhone: '(601) 746 0909',
    schedule: 'Horario por confirmar con la Cruz Roja',
    needs: 'Agua, alimentos no perecederos, aseo, cobijas y primeros auxilios.',
    sourceLabel: 'Cruz Roja / EL PAÍS',
    sourceUrl: GUIDE,
  }),
  verified({
    key: 'bogota-gobernacion-cundinamarca',
    name: 'Gobernación de Cundinamarca — punto de acopio',
    department: 'Bogotá D.C.',
    municipality: 'Bogotá',
    addressReference: 'Calle 26 # 51-53',
    latitude: 4.6399555,
    longitude: -74.0966413,
    contactName: 'Gobernación de Cundinamarca',
    contactPhone: '(601) 749 0000',
    schedule: 'Lunes a viernes, 8:30 a 16:00; confirmar vigencia',
    needs:
      'Ayudas humanitarias para Chocó, Risaralda, Caldas, Quindío y Valle del Cauca.',
    sourceLabel: 'Gobernación de Cundinamarca / EL PAÍS',
    sourceUrl: INITIATIVES,
  }),
  verified({
    key: 'cota-empresa-licores',
    name: 'Empresa de Licores de Cundinamarca — punto de acopio',
    department: 'Cundinamarca',
    municipality: 'Cota',
    addressReference: 'Autopista Medellín km 3,8, vía Siberia-Cota',
    latitude: 4.7304781,
    longitude: -74.1288006,
    contactName: 'Empresa de Licores de Cundinamarca',
    contactPhone: '01 8000 117 090',
    schedule: 'Lunes a viernes, 7:30 a 16:00; confirmar vigencia',
    needs:
      'Ayudas humanitarias para Chocó, Risaralda, Caldas, Quindío y Valle del Cauca.',
    sourceLabel: 'Gobernación de Cundinamarca / EL PAÍS',
    sourceUrl: INITIATIVES,
  }),
  verified({
    key: 'tunja-gobernacion-boyaca',
    name: 'Carpa de la Gobernación de Boyacá',
    department: 'Boyacá',
    municipality: 'Tunja',
    addressReference: 'Frente al Palacio de la Torre, Calle 20 # 9-90',
    latitude: 5.5333637,
    longitude: -73.3614618,
    contactName: 'Gobernación de Boyacá',
    contactPhone: '(608) 742 0150',
    schedule: 'Cerrado: la jornada finalizó el 14 de agosto',
    status: ReliefPointStatus.CLOSED,
    needs: '',
    sourceLabel: 'Gobernación de Boyacá / EL PAÍS',
    sourceUrl: INITIATIVES,
    caveat: 'La convocatoria publicada finalizó el 14 de agosto.',
    verifiedAt: '2026-08-15',
  }),
  verified({
    key: 'monteria-happy-lora',
    name: 'Coliseo Miguel Happy Lora',
    department: 'Córdoba',
    municipality: 'Montería',
    addressReference: 'Carrera 13, sector Villa Olímpica',
    latitude: 8.7472479,
    longitude: -75.8816517,
    contactName: 'Gobernación de Córdoba',
    contactPhone: 'No publicado',
    schedule: '8:00 a 12:30 y 14:00 a 19:00; confirmar vigencia',
    needs:
      'Agua, alimentos no perecederos, elementos de aseo, pañales, cobijas y colchones.',
    sourceLabel: 'Gobernación de Córdoba / EL PAÍS',
    sourceUrl: INITIATIVES,
  }),
  verified({
    key: 'barranquilla-casa-dann-luis-diaz',
    name: 'Casa Dann Carlton — Fundación Luis Díaz',
    department: 'Atlántico',
    municipality: 'Barranquilla',
    addressReference: 'Carrera 52C # 96-101',
    latitude: 11.0137,
    longitude: -74.8279,
    contactName: 'Fundación Luis Díaz Sembrando Esperanza',
    contactPhone: 'No publicado',
    schedule: 'Cerrado: la jornada finalizó el 14 de agosto',
    status: ReliefPointStatus.CLOSED,
    needs: '',
    sourceLabel: 'Fundación Luis Díaz / Tropicana',
    sourceUrl: LUIS_DIAZ_POINT,
    caveat:
      'La convocatoria terminó el 14 de agosto. No recibe más donaciones.',
    verifiedAt: '2026-08-15',
  }),
);

VERIFIED_RELIEF_POINTS.push(...VERIFIED_RELIEF_SERVICES);
