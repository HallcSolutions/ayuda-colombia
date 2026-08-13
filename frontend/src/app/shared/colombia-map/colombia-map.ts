import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  COLOMBIA_DEPARTMENT_SHAPES,
  COLOMBIA_ISLANDS_DEPARTMENT,
  COLOMBIA_MAP_HEIGHT,
  COLOMBIA_MAP_INSET,
  COLOMBIA_MAP_VIEWBOX,
  COLOMBIA_MAP_WIDTH,
  projectToMap,
} from '../../core/constants/colombia-map.constants';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { I18nService } from '../../core/i18n/i18n.service';
import { DepartmentShape, MapPoint } from '../../core/models/map-geometry.model';
import { RegionService } from '../../core/services/region.service';
import { streetMapUrl } from '../../core/utils/geo.util';
import {
  DepartmentArea,
  DepartmentLabel,
  MapMarker,
  MapPin,
  MapTrail,
  TrailPath,
} from './colombia-map.model';

/** Hasta dónde se acerca el mapa al enfocar un departamento pequeño como Bogotá. */
const MAX_ZOOM = 7;
/** Dentro de una ciudad se acerca mucho más: hay que poder tocar puntos de la misma cuadra. */
const MAX_CITY_ZOOM = 45;
/** Marco mínimo de una ciudad (~10 km), para que un punto suelto no acerque hasta perderse. */
const CITY_MIN_SPAN = 8;
/** Aire alrededor de la zona enfocada, proporcional a su tamaño y nunca menor que esto. */
const ZOOM_PADDING_RATIO = 0.18;
const MIN_ZOOM_PADDING = 12;

const ISLANDS_ANCHOR: MapPoint = {
  x: COLOMBIA_MAP_INSET.x + COLOMBIA_MAP_INSET.size / 2,
  y: COLOMBIA_MAP_INSET.y + COLOMBIA_MAP_INSET.size / 2,
};

/** Tamaño de los nombres de departamento: nunca más grande ni más pequeño que esto. */
const LABEL_MAX_SIZE = 30;
const LABEL_MIN_SIZE = 24;
/** Ancho medio de una letra en negrita respecto al tamaño de la fuente, para estimar el hueco. */
const LABEL_CHAR_RATIO = 0.56;
/** Aire mínimo alrededor de cada nombre para que dos no se lean pegados. */
const LABEL_GAP = 8;
/** Separación entre las dos líneas de un nombre largo. */
const LABEL_LINE_HEIGHT = 1.05;
/** A partir de aquí el nombre de una chincheta se recorta para no tapar el mapa. */
const MAX_CAPTION_CHARS = 22;
/** Tamaño y separación del nombre que va bajo cada chincheta (ver `.pin .caption`). */
const CAPTION_SIZE = 22;
const CAPTION_OFFSET = 20;
/** Hueco que ocupa el dibujo de la chincheta, con la punta apoyada en su ubicación. */
const PIN_WIDTH = 34;
const PIN_HEIGHT = 48;
const PIN_CENTER = -24;
/** Área táctil mínima para distritos y departamentos muy pequeños. */
const MIN_DEPARTMENT_HIT_SIZE = 64;
const COMPACT_DEPARTMENT_AREA = 5000;

/**
 * Reparte el nombre en una o dos líneas y devuelve el tamaño de letra más grande que cabe
 * dentro del departamento, o `null` si ni así se lee: los departamentos diminutos estrenan
 * su nombre cuando el mapa se acerca a ellos.
 */
function fitDepartmentName(
  name: string,
  width: number,
  height: number,
): Omit<DepartmentLabel, 'name' | 'x' | 'y'> | null {
  const words = name.split(' ');
  let best: { lines: string[]; fontSize: number } | null = null;

  for (let split = 0; split < words.length; split++) {
    const lines = split ? [words.slice(0, split).join(' '), words.slice(split).join(' ')] : [name];
    const longest = Math.max(...lines.map((line) => line.length));
    const fontSize = Math.min(
      width / (longest * LABEL_CHAR_RATIO),
      height / (lines.length * LABEL_LINE_HEIGHT),
    );
    if (!best || fontSize > best.fontSize) best = { lines, fontSize };
  }

  if (!best || best.fontSize < LABEL_MIN_SIZE) return null;
  return { lines: best.lines, fontSize: Math.min(best.fontSize, LABEL_MAX_SIZE) };
}

/** Espacio que ocupa un texto sobre el lienzo, para saber si dos se pisan. */
interface TextBox {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

/**
 * Caja centrada en un punto del lienzo. Nada de lo que se dibuja encima del mapa crece con
 * el zoom, así que su tamaño sobre el lienzo se divide por el acercamiento actual.
 */
function boxAround(
  { x, y }: MapPoint,
  width: number,
  height: number,
  scale: number,
  offsetY = 0,
): TextBox {
  const halfWidth = width / scale / 2;
  const halfHeight = height / scale / 2;
  const center = y + offsetY / scale;
  return {
    left: x - halfWidth,
    right: x + halfWidth,
    top: center - halfHeight,
    bottom: center + halfHeight,
  };
}

function textBox(
  point: MapPoint,
  lines: readonly string[],
  fontSize: number,
  scale: number,
  offsetY = 0,
): TextBox {
  const longest = Math.max(...lines.map((line) => line.length));
  return boxAround(
    point,
    longest * fontSize * LABEL_CHAR_RATIO + LABEL_GAP,
    lines.length * fontSize * LABEL_LINE_HEIGHT + LABEL_GAP,
    scale,
    offsetY,
  );
}

function overlaps(a: TextBox, b: TextBox): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/** Los nombres largos se recortan para que la chincheta no tape lo que hay alrededor. */
function shorten(text: string): string {
  return text.length > MAX_CAPTION_CHARS
    ? `${text.slice(0, MAX_CAPTION_CHARS - 1).trimEnd()}…`
    : text;
}

/**
 * Mapa de Colombia para buscar ayuda señalando en lugar de escribir: cada punto es una
 * chincheta que se toca para ver sus datos, y cada departamento se toca para acercarse.
 * Solo dibuja y avisa qué se eligió; el detalle lo pone quien lo usa con `<ng-content>`.
 */
@Component({
  selector: 'app-colombia-map',
  templateUrl: './colombia-map.html',
  styleUrl: './colombia-map.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColombiaMap {
  readonly region = inject(RegionService);

  readonly markers = input.required<readonly MapMarker[]>();
  /** Caminos dibujados bajo las chinchetas: recorrido hecho y tramo que falta. */
  readonly trails = input<readonly MapTrail[]>([]);
  readonly selectedId = input<string | null>(null);
  /** Punto elegido, o `null` cuando se cierra el detalle o se cambia de zona. */
  readonly markerSelected = output<MapMarker | null>();

  protected readonly t = inject(I18nService).t;
  protected readonly viewBox = COLOMBIA_MAP_VIEWBOX;
  protected readonly inset = COLOMBIA_MAP_INSET;

  private readonly detail = viewChild<ElementRef<HTMLElement>>('detail');
  private readonly sanitizer = inject(DomSanitizer);

  /** El punto abierto en la ficha, para poder enseñar sus calles. */
  private readonly selectedMarker = computed(
    () => this.markers().find((marker) => marker.id === this.selectedId()) ?? null,
  );

  /**
   * Callejero del punto abierto. El dibujo de Colombia sirve para escoger la zona, pero no
   * dice por qué calle se llega: eso lo enseña este recuadro, y solo se carga cuando alguien
   * abre una ficha, no antes.
   */
  readonly streetMap = computed<SafeResourceUrl | null>(() => {
    const marker = this.selectedMarker();
    if (!marker) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(streetMapUrl(marker));
  });

  streetMapTitle(): string {
    return this.t('map.streetTitle', { place: this.selectedMarker()?.label ?? '' });
  }

  constructor() {
    // En un teléfono la ficha se abre debajo del mapa: se acerca sola para no buscarla.
    effect(() =>
      this.detail()?.nativeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
    );
  }

  /** Puntos de la zona enfocada; sin zona son todos los del país. */
  private readonly visibleMarkers = computed(() =>
    this.markers().filter((marker) => this.region.matches(marker)),
  );

  /**
   * Caminos de la zona enfocada, ya proyectados. Se dibujan enteros aunque crucen otros
   * departamentos: un recorrido cortado por la mitad no dice de dónde viene el camión.
   * El archipiélago queda fuera a propósito: allá no se llega por carretera.
   */
  readonly trailPaths = computed<TrailPath[]>(() =>
    this.trails()
      .filter((trail) => trail.points.length > 1 && this.region.matches(trail))
      .map((trail) => ({
        id: trail.id,
        tone: trail.tone,
        pending: trail.pending,
        d: trail.points
          .map((point, index) => {
            const { x, y } = projectToMap(point);
            return `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
          })
          .join(' '),
      })),
  );

  readonly areas = computed<DepartmentArea[]>(() => {
    const counts = new Map<string, number>();
    for (const marker of this.markers()) {
      counts.set(marker.department, (counts.get(marker.department) ?? 0) + 1);
    }
    return COLOMBIA_DEPARTMENT_SHAPES.map((shape) => ({
      shape,
      count: counts.get(shape.name) ?? 0,
      selected: this.region.department() === shape.name,
    })).sort(
      (first, second) =>
        second.shape.bbox[2] * second.shape.bbox[3] - first.shape.bbox[2] * first.shape.bbox[3],
    );
  });

  /**
   * El mapa se recorre en tres pasos: el país muestra sus ciudades, un departamento muestra
   * las ciudades donde hay algo registrado, y una ciudad ya muestra sus puntos uno a uno.
   */
  private readonly placedPins = computed<MapPin[]>(() =>
    this.spreadCrowded(
      this.region.municipality() ? this.singlePins() : this.cityPins(),
      this.zoom().scale,
    ),
  );

  /**
   * Nombres bajo las chinchetas. Cuando dos quedan encima solo se escribe el de la chincheta
   * más importante (la abierta, o la que agrupa más puntos); la otra sigue ahí para tocarla.
   */
  private readonly captions = computed(() => {
    const { scale } = this.zoom();
    const byImportance = [...this.placedPins()].sort(
      (first, second) =>
        Number(second.selected) - Number(first.selected) || second.count - first.count,
    );

    // Las chinchetas siempre se dibujan: los nombres se acomodan a lo que dejan libre.
    const boxes: TextBox[] = this.placedPins().map((pin) =>
      boxAround(pin, PIN_WIDTH, PIN_HEIGHT, scale, PIN_CENTER),
    );
    const written = new Set<string>();
    for (const pin of byImportance) {
      const box = textBox(pin, [pin.caption], CAPTION_SIZE, scale, CAPTION_OFFSET);
      if (boxes.some((other) => overlaps(other, box))) continue;
      boxes.push(box);
      written.add(pin.key);
    }
    return { boxes, written };
  });

  readonly pins = computed<MapPin[]>(() => {
    const { written } = this.captions();
    return this.placedPins().map((pin) => (written.has(pin.key) ? pin : { ...pin, caption: '' }));
  });

  /**
   * Marco que abarca los puntos de la ciudad elegida, con un tamaño mínimo para que un solo
   * punto no acerque el mapa hasta perder toda referencia de dónde está.
   */
  private readonly cityBounds = computed<DepartmentShape['bbox'] | null>(() => {
    const places = this.visibleMarkers().map((marker) => this.locate(marker));
    if (!places.length) return null;

    const xs = places.map((place) => place.x);
    const ys = places.map((place) => place.y);
    const width = Math.max(Math.max(...xs) - Math.min(...xs), CITY_MIN_SPAN);
    const height = Math.max(Math.max(...ys) - Math.min(...ys), CITY_MIN_SPAN);
    return [
      (Math.min(...xs) + Math.max(...xs)) / 2 - width / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2 - height / 2,
      width,
      height,
    ];
  });

  /** Traslado y acercamiento del dibujo hacia la zona enfocada: departamento o ciudad. */
  readonly zoom = computed(() => {
    const focused = this.areas().find((area) => area.selected);
    if (!focused) return { scale: 1, x: 0, y: 0 };

    const city = this.region.municipality() ? this.cityBounds() : null;
    const [x, y, width, height] = city ?? focused.shape.bbox;
    const padding = Math.max(Math.max(width, height) * ZOOM_PADDING_RATIO, MIN_ZOOM_PADDING);
    const scale = Math.min(
      COLOMBIA_MAP_WIDTH / (width + padding * 2),
      COLOMBIA_MAP_HEIGHT / (height + padding * 2),
      city ? MAX_CITY_ZOOM : MAX_ZOOM,
    );
    return {
      scale,
      x: COLOMBIA_MAP_WIDTH / 2 - scale * (x + width / 2),
      y: COLOMBIA_MAP_HEIGHT / 2 - scale * (y + height / 2),
    };
  });

  readonly canvasTransform = computed(() => {
    const { x, y, scale } = this.zoom();
    return `translate(${x}px, ${y}px) scale(${scale})`;
  });

  /**
   * Nombres de departamento escritos sobre el mapa. Solo se escribe el que cabe dentro de su
   * departamento y no pisa nada: primero mandan los nombres de las chinchetas, luego los
   * departamentos más grandes. Al acercarse se libera sitio y aparecen los que faltaban.
   */
  readonly departmentLabels = computed<DepartmentLabel[]>(() => {
    const { scale } = this.zoom();
    const roomiestFirst = [...COLOMBIA_DEPARTMENT_SHAPES].sort(
      (first, second) => second.bbox[2] * second.bbox[3] - first.bbox[2] * first.bbox[3],
    );

    const boxes = [...this.captions().boxes];
    const written: DepartmentLabel[] = [];
    for (const shape of roomiestFirst) {
      const [, , width, height] = shape.bbox;
      const fit = fitDepartmentName(shape.name, width * scale, height * scale);
      if (!fit) continue;
      const anchor = { x: shape.labelX, y: shape.labelY };
      const box = textBox(anchor, fit.lines, fit.fontSize, scale);
      if (boxes.some((other) => overlaps(other, box))) continue;
      boxes.push(box);
      written.push({ ...fit, ...anchor, name: shape.name });
    }
    return written;
  });

  /** Nombre de la zona enfocada, para el encabezado del mapa. */
  readonly zoneLabel = computed(() => {
    const municipality = this.region.municipality();
    const department = this.region.department();
    if (!department) return this.t('map.wholeCountryZone');
    return municipality ? `${municipality}, ${department}` : department;
  });

  /** Chinchetas y nombres mantienen su tamaño aunque el mapa esté acercado. */
  scaledTransform(point: MapPoint): string {
    return `translate(${point.x}px, ${point.y}px) scale(${1 / this.zoom().scale})`;
  }

  /** Reparte las líneas de un nombre alrededor de su punto de anclaje. */
  lineOffset(label: DepartmentLabel, index: number): number {
    return (index - (label.lines.length - 1) / 2) * label.fontSize * LABEL_LINE_HEIGHT;
  }

  areaLabel(area: DepartmentArea): string {
    const key = area.count ? 'map.departmentLabel' : 'map.departmentEmpty';
    return this.t(key, { department: area.shape.name, count: area.count });
  }

  /**
   * Bogotá y otros territorios pequeños son difíciles de pulsar sobre su silueta real. Su
   * rectángulo invisible mantiene una zona táctil cómoda sin alterar el dibujo del mapa.
   */
  hasExpandedHitTarget(area: DepartmentArea): boolean {
    const [, , width, height] = area.shape.bbox;
    return width * height < COMPACT_DEPARTMENT_AREA;
  }

  hitTargetX(area: DepartmentArea): number {
    const [x, , width] = area.shape.bbox;
    return x - (Math.max(width, MIN_DEPARTMENT_HIT_SIZE) - width) / 2;
  }

  hitTargetY(area: DepartmentArea): number {
    const [, y, , height] = area.shape.bbox;
    return y - (Math.max(height, MIN_DEPARTMENT_HIT_SIZE) - height) / 2;
  }

  hitTargetWidth(area: DepartmentArea): number {
    return Math.max(area.shape.bbox[2], MIN_DEPARTMENT_HIT_SIZE);
  }

  hitTargetHeight(area: DepartmentArea): number {
    return Math.max(area.shape.bbox[3], MIN_DEPARTMENT_HIT_SIZE);
  }

  /** Tocar un departamento lo enfoca; tocarlo de nuevo vuelve a todo el país. */
  focusDepartment(area: DepartmentArea): void {
    this.region.setDepartment(area.selected ? '' : area.shape.name);
    this.markerSelected.emit(null);
  }

  /** Un punto abre su información; un grupo de ciudad se acerca para poder elegir. */
  choosePin(pin: MapPin): void {
    if (pin.marker) {
      this.markerSelected.emit(pin.marker);
      return;
    }
    this.region.setDepartment(pin.department);
    this.region.setMunicipality(pin.municipality);
    this.markerSelected.emit(null);
  }

  /** Volver a ver todas las ciudades del departamento en el que se está. */
  showWholeDepartment(): void {
    this.region.setMunicipality('');
    this.markerSelected.emit(null);
  }

  showWholeCountry(): void {
    this.region.setDepartment('');
    this.markerSelected.emit(null);
  }

  private singlePins(): MapPin[] {
    return this.visibleMarkers().map((marker) => ({
      ...this.locate(marker),
      key: marker.id,
      label: marker.label,
      caption: shorten(marker.label),
      count: 1,
      tone: marker.tone,
      urgent: marker.urgent,
      selected: this.selectedId() === marker.id,
      marker,
      municipality: marker.municipality,
      department: marker.department,
    }));
  }

  private cityPins(): MapPin[] {
    const cities = new Map<string, MapMarker[]>();
    for (const marker of this.visibleMarkers()) {
      const key = `${marker.department}|${marker.municipality}`;
      cities.set(key, [...(cities.get(key) ?? []), marker]);
    }

    return [...cities.entries()].map(([key, markers]) => {
      const places = markers.map((marker) => this.locate(marker));
      const single = markers.length === 1 ? markers[0] : null;
      return {
        x: places.reduce((total, place) => total + place.x, 0) / places.length,
        y: places.reduce((total, place) => total + place.y, 0) / places.length,
        key,
        label: single ? single.label : markers[0].municipality,
        // Sin acercar, la chincheta representa una ciudad: se escribe la ciudad, no el punto.
        caption: shorten(markers[0].municipality),
        count: markers.length,
        tone: single?.tone ?? 'active',
        urgent: markers.some((marker) => marker.urgent),
        selected: Boolean(single && this.selectedId() === single.id),
        marker: single,
        municipality: markers[0].municipality,
        department: markers[0].department,
      };
    });
  }

  /**
   * Varios puntos de la misma cuadra taparían sus chinchetas por mucho que se acerque el mapa.
   * Cuando eso pasa se abren en abanico alrededor del sitio real para poder tocarlos uno a uno:
   * a esa distancia la chincheta ya no señala una dirección exacta, la señala la ficha.
   */
  private spreadCrowded(pins: MapPin[], scale: number): MapPin[] {
    const spacing = PIN_WIDTH / scale;
    const crowds: MapPin[][] = [];
    for (const pin of pins) {
      const crowd = crowds.find((group) =>
        group.some((other) => Math.hypot(other.x - pin.x, other.y - pin.y) < spacing),
      );
      if (crowd) crowd.push(pin);
      else crowds.push([pin]);
    }

    return crowds.flatMap((crowd) => {
      if (crowd.length === 1) return crowd;
      const centerX = crowd.reduce((total, pin) => total + pin.x, 0) / crowd.length;
      const centerY = crowd.reduce((total, pin) => total + pin.y, 0) / crowd.length;
      const radius = spacing * 0.8;
      return crowd.map((pin, index) => {
        const angle = (2 * Math.PI * index) / crowd.length - Math.PI / 2;
        return {
          ...pin,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        };
      });
    });
  }

  /** El archipiélago no cabe a escala: sus puntos se muestran en el recuadro ampliado. */
  private locate(marker: MapMarker): MapPoint {
    return marker.department === COLOMBIA_ISLANDS_DEPARTMENT
      ? ISLANDS_ANCHOR
      : projectToMap(marker);
  }
}
