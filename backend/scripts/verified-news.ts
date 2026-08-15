import { PublicNewsCategory } from '../src/common/constants/app.constants';

export interface VerifiedNewsSeed {
  title: string;
  summary: string;
  steps: string[];
  requirements: string[];
  category: PublicNewsCategory;
  department: string;
  municipality: string;
  sourceName: string;
  sourceUrl: string;
  contactInfo: string;
  publishedAt: string;
  validUntil: string | null;
  featured: boolean;
}

/**
 * Publicaciones generales que se sembraron antes de limitar este espacio a
 * desastres activos. El seed las archiva para que no vuelvan a aparecer.
 */
export const OBSOLETE_NEWS_SOURCE_URLS = [
  'https://www.unidadvictimas.gov.co/atencion-y-servicios-a-la-ciudadania/',
  'https://www.medellin.gov.co/es/tramites-y-servicios/atencion-inmediata-para-poblacion-victima-del-conflicto-armado/',
  'https://bogota.gov.co/servicios/tramites/visita-tecnica-de-valoracion-de-la-condicion-de-riesgos-inminente',
  'https://gestion.manizales.gov.co/isolucion/bancoconocimiento/c/c54d3c7579614a96b5088c8d8170a305/c54d3c7579614a96b5088c8d8170a305.html',
  'https://www.cali.gov.co/preguntas-frecuentes/14069/secretaria-de-gestion-del-riesgo-de-emergencia-y-desastres/',
];

/**
 * Boletines de desastres activos, comprobados el 15 de agosto de 2026 en
 * fuentes públicas oficiales. Aquí no se incluyen programas sociales,
 * convocatorias ni trámites generales que no hayan nacido de la emergencia.
 */
export const VERIFIED_NEWS: VerifiedNewsSeed[] = [
  {
    title: 'Terremoto del 10 de agosto: consulte las réplicas en el SGC',
    summary:
      'El terremoto con epicentro en San José del Palmar, Chocó, afectó varias zonas del occidente de Colombia. El visor del Servicio Geológico Colombiano reúne la información técnica oficial del evento y de las réplicas; los daños y necesidades deben reportarse ante las autoridades de cada municipio.',
    steps: [
      'Consulte el visor del Servicio Geológico Colombiano para confirmar la ubicación, magnitud y profundidad de cada réplica.',
      'No regrese a una estructura dañada hasta que la autoridad municipal o un equipo técnico confirme que es segura.',
      'Reporte personas atrapadas, derrumbes, fugas, incendios o daños graves a los organismos de emergencia de su municipio.',
    ],
    requirements: [],
    category: PublicNewsCategory.EARTHQUAKE,
    department: '',
    municipality: '',
    sourceName: 'Servicio Geológico Colombiano',
    sourceUrl: 'https://www.sgc.gov.co/sismos',
    contactInfo:
      'Para información sísmica consulte el SGC; para atención y rescate contacte a los organismos de emergencia de su municipio.',
    publishedAt: '2026-08-10T12:00:00-05:00',
    validUntil: null,
    featured: true,
  },
  {
    title: 'Caldas: regreso a clases y PAE después del sismo',
    summary:
      'Tras el sismo del 10 de agosto, las sedes educativas solo pueden reabrir cuando la autoridad municipal de riesgo las evalúe y la Secretaría de Educación lo autorice. En las sedes aún no habilitadas habrá trabajo pedagógico en casa y ajustes temporales al PAE.',
    steps: [
      'Espere la comunicación oficial de su institución educativa antes de enviar al estudiante a la sede.',
      'Pregunte al colegio cómo entregará el trabajo en casa y el complemento alimentario mientras la sede siga sin autorización.',
      'No ingrese a una sede afectada hasta que la evaluación técnica y la Secretaría de Educación confirmen que es segura.',
    ],
    requirements: [],
    category: PublicNewsCategory.EARTHQUAKE,
    department: 'Caldas',
    municipality: '',
    sourceName: 'Gobernación de Caldas — Secretaría de Educación',
    sourceUrl:
      'https://caldas.gov.co/noticias-gobernacion/149-educacion/16734-pae-sin-pausa-educacion-en-casa-y-proceso-de-retorno-seguro-asi-ordena-caldas-la-prestacion-de-los-servicios-educativos',
    contactInfo:
      'Consulte directamente con su institución educativa o con la Secretaría de Educación de su municipio.',
    publishedAt: '2026-08-13T12:00:00-05:00',
    validUntil: '2026-08-28T23:59:59-05:00',
    featured: true,
  },
  {
    title: 'Villamaría: continúa el censo de viviendas afectadas por el sismo',
    summary:
      'La Gobernación y el municipio continúan visitando a las familias, levantando censos y haciendo evaluaciones técnicas de las viviendas dañadas. El registro preciso de las afectaciones orientará la recuperación y la entrega de apoyos.',
    steps: [
      'Reporte la vivienda afectada ante la Alcaldía de Villamaría o el equipo municipal de gestión del riesgo.',
      'No vuelva a entrar si observa grietas, desprendimientos o riesgo de caída; espere la revisión técnica.',
      'Confirme que el hogar quedó incluido en el censo y conserve los datos del funcionario o del reporte para hacer seguimiento.',
    ],
    requirements: [
      'Dirección y ubicación clara de la vivienda afectada.',
      'Datos básicos de las personas que integran el hogar.',
      'Descripción de los daños y fotografías, únicamente si puede tomarlas sin ponerse en riesgo.',
    ],
    category: PublicNewsCategory.EARTHQUAKE,
    department: 'Caldas',
    municipality: 'Villamaría',
    sourceName: 'Gobernación de Caldas',
    sourceUrl:
      'https://caldas.gov.co/noticias-gobernacion/181-general/16730-gobernador-henry-gutierrez-recorrio-villamaria-y-escucho-a-las-familias-afectadas-esta-semana-seguira-verificando-situaciones-en-otros-municipios',
    contactInfo:
      'Alcaldía de Villamaría y Consejo Municipal de Gestión del Riesgo.',
    publishedAt: '2026-08-12T12:00:00-05:00',
    validUntil: null,
    featured: true,
  },
  {
    title: 'Caldas verifica hospitales y continuidad de los servicios de salud',
    summary:
      'Equipos del Ministerio de Salud, el Instituto Nacional de Salud y la Dirección Territorial de Salud de Caldas revisan daños en la infraestructura hospitalaria y la continuidad de los servicios después del sismo.',
    steps: [
      'Antes de desplazarse, confirme por los canales de su hospital o municipio que el servicio funciona en la sede habitual.',
      'Si una sede fue cerrada o trasladada, siga únicamente la ubicación temporal publicada por la autoridad de salud.',
      'En una urgencia, acuda al servicio habilitado más cercano e informe que necesita atención inmediata.',
    ],
    requirements: [],
    category: PublicNewsCategory.EARTHQUAKE,
    department: 'Caldas',
    municipality: '',
    sourceName: 'Gobernación de Caldas — Dirección Territorial de Salud',
    sourceUrl:
      'https://caldas.gov.co/noticias-gobernacion/139-salud/16728-ministerio-e-instituto-nacional-de-salud-verifican-condiciones-de-infraestructura-hospitalaria-y-prestacion-de-servicios-en-caldas',
    contactInfo:
      'Consulte los canales oficiales de la Dirección Territorial de Salud de Caldas y de su hospital municipal.',
    publishedAt: '2026-08-12T12:00:00-05:00',
    validUntil: null,
    featured: false,
  },
  {
    title:
      'Caldas activa un fondo solidario para negocios afectados por el sismo',
    summary:
      'La Gobernación y las cámaras de comercio de Caldas crearon un fondo para apoyar la recuperación de comerciantes y empresarios damnificados por el sismo. La información de aportes y el proceso de caracterización deben comprobarse en los canales oficiales.',
    steps: [
      'Si su negocio fue afectado, consulte con la cámara de comercio de su jurisdicción cómo registrar los daños y entrar en la caracterización.',
      'Conserve evidencias de los daños y la información del establecimiento sin ingresar a estructuras inseguras.',
      'Si va a donar, verifique el titular y los datos bancarios directamente en la publicación oficial antes de transferir.',
    ],
    requirements: [
      'Negocio o actividad empresarial afectada por el sismo en Caldas.',
      'Información que permita ubicar y caracterizar el establecimiento afectado.',
    ],
    category: PublicNewsCategory.EARTHQUAKE,
    department: 'Caldas',
    municipality: '',
    sourceName: 'Gobernación de Caldas y cámaras de comercio',
    sourceUrl:
      'https://caldas.gov.co/noticias-gobernacion/181-general/16729-fondo-solidario-por-los-empresarios-de-caldas-gobierno-departamental-y-camaras-de-comercio-unen-esfuerzos-para-apoyar-la-recuperacion-empresarial',
    contactInfo:
      'Cámara de Comercio de Manizales por Caldas o Cámara de Comercio de La Dorada, Puerto Boyacá, Puerto Salgar y Oriente de Caldas.',
    publishedAt: '2026-08-12T12:00:00-05:00',
    validUntil: null,
    featured: false,
  },
  {
    title:
      'El Niño 2026: consulte el riesgo de su municipio y siga las alertas',
    summary:
      'Colombia declaró desastre nacional por los efectos de El Niño 2026–2027. La UNGRD publica información territorial sobre escasez de agua, incendios forestales y otras afectaciones para que cada comunidad siga las medidas de su municipio.',
    steps: [
      'Consulte en el visor de la UNGRD el nivel de afectación previsto para su departamento y municipio.',
      'Siga las restricciones de agua y los avisos de incendio publicados por la alcaldía y los organismos de socorro.',
      'Evite quemas abiertas y reporte de inmediato humo, fuego o desabastecimiento a la autoridad local de emergencias.',
    ],
    requirements: [],
    category: PublicNewsCategory.DROUGHT,
    department: '',
    municipality: '',
    sourceName: 'Unidad Nacional para la Gestión del Riesgo de Desastres',
    sourceUrl:
      'https://portal.gestiondelriesgo.gov.co/Paginas/Fenomeno-de-El-Nino-2026.aspx',
    contactInfo:
      'Consulte la alcaldía, el consejo municipal de gestión del riesgo y los organismos de socorro de su zona.',
    publishedAt: '2026-07-25T12:00:00-05:00',
    validUntil: '2027-07-23T23:59:59-05:00',
    featured: true,
  },
];
