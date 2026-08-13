/**
 * Regenera `src/app/core/constants/colombia-map.constants.ts`, el dibujo del mapa.
 *
 * Solo hace falta ejecutarlo si cambia la división departamental o si se quiere otro
 * nivel de detalle (constante `TOLERANCE` dentro de `simplify`). Uso:
 *
 *   curl -sL -o /tmp/colombia.geo.json \
 *     https://gist.githubusercontent.com/john-guerra/43c7656821069d00dcbc/raw/be6a6e239cd5b5b803c6e7c2ec405b793a9064dd/Colombia.geo.json
 *   node scripts/build-colombia-map.mjs /tmp/colombia.geo.json
 *
 * La fuente es el mapa departamental del DANE en WGS84 (longitud/latitud).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const source = process.argv[2];
if (!source) throw new Error('Indica la ruta del GeoJSON de departamentos. Ver el encabezado.');
const geo = JSON.parse(readFileSync(source, 'utf8'));

const ISLANDS = 'ARCHIPIELAGO DE SAN ANDRES PROVIDENCIA Y SANTA CATALINA';
const NAMES = {
  AMAZONAS: 'Amazonas',
  ANTIOQUIA: 'Antioquia',
  ARAUCA: 'Arauca',
  [ISLANDS]: 'San Andrés y Providencia',
  ATLANTICO: 'Atlántico',
  BOLIVAR: 'Bolívar',
  BOYACA: 'Boyacá',
  CALDAS: 'Caldas',
  CAQUETA: 'Caquetá',
  CASANARE: 'Casanare',
  CAUCA: 'Cauca',
  CESAR: 'Cesar',
  CHOCO: 'Chocó',
  CORDOBA: 'Córdoba',
  CUNDINAMARCA: 'Cundinamarca',
  GUAINIA: 'Guainía',
  GUAVIARE: 'Guaviare',
  HUILA: 'Huila',
  'LA GUAJIRA': 'La Guajira',
  MAGDALENA: 'Magdalena',
  META: 'Meta',
  NARIÑO: 'Nariño',
  'NORTE DE SANTANDER': 'Norte de Santander',
  PUTUMAYO: 'Putumayo',
  QUINDIO: 'Quindío',
  RISARALDA: 'Risaralda',
  'SANTAFE DE BOGOTA D.C': 'Bogotá D.C.',
  SANTANDER: 'Santander',
  SUCRE: 'Sucre',
  TOLIMA: 'Tolima',
  'VALLE DEL CAUCA': 'Valle del Cauca',
  VAUPES: 'Vaupés',
  VICHADA: 'Vichada',
};

const ringsOf = (geometry) =>
  geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat();

const departments = geo.features.map((f) => {
  const key = f.properties.NOMBRE_DPT.trim();
  if (!NAMES[key]) throw new Error(`Departamento sin nombre canónico: ${key}`);
  return { key, name: NAMES[key], rings: ringsOf(f.geometry) };
});

// Douglas-Peucker
function simplify(points, tol) {
  if (points.length < 4) return points;
  const sqTol = tol * tol;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxD = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = sqSegDist(points[i], points[a], points[b]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > sqTol && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function sqSegDist(p, a, b) {
  let [x, y] = a;
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx || dy) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) [x, y] = b;
    else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

const area = (r) =>
  Math.abs(
    r.reduce((s, p, i) => {
      const q = r[(i + 1) % r.length];
      return s + (p[0] * q[1] - q[0] * p[1]);
    }, 0) / 2,
  );
const centroid = (r) => [
  r.reduce((s, p) => s + p[0], 0) / r.length,
  r.reduce((s, p) => s + p[1], 0) / r.length,
];

// Lienzo anclado al territorio continental; el archipiélago va aparte en un recuadro
const continental = departments.filter((d) => d.key !== ISLANDS).flatMap((d) => d.rings.flat());
const round = (v, step) => Number((Math.round(v / step) * step).toFixed(2));
const BOUNDS = {
  west: round(Math.min(...continental.map((p) => p[0])), 0.01),
  east: round(Math.max(...continental.map((p) => p[0])), 0.01),
  south: round(Math.min(...continental.map((p) => p[1])), 0.01),
  north: round(Math.max(...continental.map((p) => p[1])), 0.01),
};

const WIDTH = 1000;
const HEIGHT = Math.round(
  (WIDTH * (BOUNDS.north - BOUNDS.south)) /
    ((BOUNDS.east - BOUNDS.west) * Math.cos((5.5 * Math.PI) / 180)),
);
const project = ([lon, lat]) => [
  ((lon - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * WIDTH,
  ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * HEIGHT,
];

// A escala real las islas serían invisibles: se amplían y solo conservan su posición relativa
const INSET = { x: 22, y: 34, size: 132 };
const islandRings = departments.find((d) => d.key === ISLANDS).rings;
const centers = islandRings.map(centroid);
const spanOf = (values) => Math.max(...values) - Math.min(...values);
const centerSpan =
  Math.max(spanOf(centers.map((c) => c[0])), spanOf(centers.map((c) => c[1]))) || 1;
const mid = [
  (Math.min(...centers.map((c) => c[0])) + Math.max(...centers.map((c) => c[0]))) / 2,
  (Math.min(...centers.map((c) => c[1])) + Math.max(...centers.map((c) => c[1]))) / 2,
];
const ISLAND_ZOOM =
  (INSET.size * 0.32) /
  Math.max(
    ...islandRings.map((r) => Math.max(spanOf(r.map((p) => p[0])), spanOf(r.map((p) => p[1])))),
  );
const islandRing = (ring) => {
  const c = centroid(ring);
  const ox = INSET.x + INSET.size / 2 + ((c[0] - mid[0]) / centerSpan) * INSET.size * 0.4;
  const oy = INSET.y + INSET.size / 2 - ((c[1] - mid[1]) / centerSpan) * INSET.size * 0.4;
  return ring.map(([lon, lat]) => [
    ox + (lon - c[0]) * ISLAND_ZOOM,
    oy - (lat - c[1]) * ISLAND_ZOOM,
  ]);
};

const shapes = departments.map(({ key, name, rings }) => {
  const isIsland = key === ISLANDS;
  const projected = rings
    .map((ring) => (isIsland ? islandRing(ring) : ring.map(project)))
    .map((ring) => simplify(ring, isIsland ? 0.2 : 0.7))
    .filter((ring) => ring.length > 3);

  const biggest = Math.max(...projected.map(area));
  // Se descartan islotes que no se distinguirían; el archipiélago conserva sus islas
  const kept = projected.filter((r) => area(r) > (isIsland ? 0.5 : Math.max(biggest * 0.003, 6)));

  const d = kept
    .map((ring) => `M${ring.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`)
    .join('');

  const main = kept.reduce((a, b) => (area(a) > area(b) ? a : b));
  const all = kept.flat();
  const bbox = [
    Math.min(...all.map((p) => p[0])),
    Math.min(...all.map((p) => p[1])),
    spanOf(all.map((p) => p[0])),
    spanOf(all.map((p) => p[1])),
  ].map((v) => Math.round(v));

  return {
    name,
    d,
    labelX: Math.round(centroid(main)[0]),
    labelY: Math.round(isIsland ? INSET.y + INSET.size - 14 : centroid(main)[1]),
    bbox,
    rings: kept.length,
    pts: kept.reduce((s, r) => s + r.length, 0),
  };
});

shapes.sort((a, b) => a.name.localeCompare(b.name, 'es'));
console.log('lienzo', WIDTH, 'x', HEIGHT, '| bounds', JSON.stringify(BOUNDS));
for (const s of shapes) console.log(s.name.padEnd(28), 'rings', s.rings, 'pts', s.pts);
console.log(
  'peso total paths',
  shapes.reduce((s, x) => s + x.d.length, 0),
);

const ts = `/**
 * Mapa de Colombia sobre un lienzo de ${WIDTH}x${HEIGHT}.
 *
 * Archivo generado por \`scripts/build-colombia-map.mjs\`: no se edita a mano.
 * Los contornos vienen del mapa departamental del DANE, simplificados para que el mapa
 * pese poco: sirven para ubicar y elegir una zona, no para medir ni delimitar fronteras.
 * El lienzo está anclado a \`COLOMBIA_MAP_BOUNDS\`, así que cualquier punto con latitud y
 * longitud se ubica con \`projectToMap\`. El archipiélago de San Andrés y Providencia se
 * dibuja ampliado dentro de \`COLOMBIA_MAP_INSET\`, como en los mapas oficiales, porque a
 * escala real sería invisible.
 */
import { Coordinates } from '../models/coordinates.model';
import { DepartmentShape, MapPoint } from '../models/map-geometry.model';

export const COLOMBIA_MAP_WIDTH = ${WIDTH};
export const COLOMBIA_MAP_HEIGHT = ${HEIGHT};
export const COLOMBIA_MAP_VIEWBOX = \`0 0 \${COLOMBIA_MAP_WIDTH} \${COLOMBIA_MAP_HEIGHT}\`;

/** Extremos del territorio continental que enmarcan el lienzo. */
export const COLOMBIA_MAP_BOUNDS = {
  west: ${BOUNDS.west},
  east: ${BOUNDS.east},
  south: ${BOUNDS.south},
  north: ${BOUNDS.north},
} as const;

/** Recuadro donde se dibuja ampliado el archipiélago. */
export const COLOMBIA_MAP_INSET = { x: ${INSET.x}, y: ${INSET.y}, size: ${INSET.size} } as const;

/** Departamento insular: sus puntos se ubican en el recuadro, no en el continente. */
export const COLOMBIA_ISLANDS_DEPARTMENT = 'San Andrés y Providencia';

/** Ubica una coordenada real dentro del lienzo del mapa. */
export function projectToMap({ latitude, longitude }: Coordinates): MapPoint {
  const { west, east, south, north } = COLOMBIA_MAP_BOUNDS;
  return {
    x: ((longitude - west) / (east - west)) * COLOMBIA_MAP_WIDTH,
    y: ((north - latitude) / (north - south)) * COLOMBIA_MAP_HEIGHT,
  };
}

export const COLOMBIA_DEPARTMENT_SHAPES: readonly DepartmentShape[] = [
${shapes
  .map(
    (s) =>
      `  { name: ${JSON.stringify(s.name)}, labelX: ${s.labelX}, labelY: ${s.labelY}, bbox: [${s.bbox.join(', ')}], d: ${JSON.stringify(s.d)} },`,
  )
  .join('\n')}
];
`;

const destination = new URL('../src/app/core/constants/colombia-map.constants.ts', import.meta.url);
writeFileSync(destination, ts);
console.log('escrito colombia-map.constants.ts', ts.length, 'bytes');
