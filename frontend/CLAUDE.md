<!-- chalc:start -->

## ⚙️ Chalc

### ✅ Mandatory principles (ALWAYS)

Minimal implementation, Clean Code, SOLID and **modular architecture** apply to **all** code in this project — no exceptions:
high cohesion and low coupling, small units, explicit names, one responsibility per file/folder/symbol,
code that is testable by design, and the smallest change that satisfies the current approved requirement
or failing test. Reuse existing code and framework APIs before adding files, wrappers, abstractions,
dependencies, tooling or layers. The `minimal-implementation`, `clean-code`, `solid-principles` and
`modular-architecture` skills define the detail — **open and apply them by default**, not only when explicitly asked.

### Skills activas

- `angular-component`
- `angular-di`
- `angular-directives`
- `angular-forms`
- `angular-http`
- `angular-routing`
- `angular-signals`
- `angular-ssr`
- `angular-testing`
- `angular-tooling`
- `tailwind-best-practices`
- `responsive-design`
- `interface-design`
- `angular-migration`
- `clean-code`
- `minimal-implementation`
- `solid-principles`
- `modular-architecture`
- `mutation-testing`

### Servidores MCP

- `angular-cli` — Servidor MCP oficial del Angular CLI (on-demand, no requiere instalar nada).

<!-- chalc:end -->

## 🌐 Multilenguaje (obligatorio)

**Ningún texto visible para la persona usuaria se escribe directo en plantillas, componentes o servicios.**
Todo pasa por el catálogo de traducciones.

- Catálogo base: `src/app/core/i18n/es.translations.ts`. Sus claves definen el tipo `TranslationKey`.
- Cada idioma adicional implementa `TranslationCatalog` (`en.translations.ts`); si falta una clave, **no compila**.
- Uso en componentes: `protected readonly t = inject(I18nService).t;` y en la plantilla `{{ t('clave') }}`.
  `t` lee el signal `locale`, así que cambiar de idioma repinta la interfaz sin recargar.
- Interpolación: `{{ t('alertBanner.title', { count: alerts().length }) }}` con marcadores `{nombre}`.
- Mensajes de error/éxito: guarda la **clave** en un signal y traduce con un `computed`, nunca el texto ya traducido
  (si no, el mensaje se queda en el idioma anterior al cambiar de idioma).
- Etiquetas de enums (`ReliefPointType`, `SupplyCategory`, `MealType`, `UrgencyLevel`, `ReportStatus`):
  se derivan del valor del enum con los helpers de `core/i18n/domain-keys.ts`. No dupliques mapas de etiquetas.
- Fechas y números: pasa el locale activo al pipe → `| date: 'd MMM, h:mm a' : undefined : i18n.locale()`.
- Idioma nuevo: crear `xx.translations.ts`, añadirlo a `LOCALES` y `CATALOGS` en `i18n.service.ts`,
  registrar `registerLocaleData` en `app.config.ts` y añadir la clave `language.xx`.
- El idioma se detecta del navegador, se puede cambiar con `app-language-switcher` y se guarda en `localStorage`.

## 🗺️ Cobertura nacional (departamento y ciudad)

La emergencia es de todo el país: **ninguna vista puede quedar amarrada a un solo municipio**.

- `RegionService` (`core/services/region.service.ts`) guarda la zona elegida (`department`, `municipality`).
  Cadena vacía = todo el país / todas las ciudades. Se persiste en `localStorage`.
- Los departamentos salen de `core/constants/colombia.constants.ts`; los municipios se descubren de los
  puntos ya registrados (`ReliefPointsService.municipalitiesOf`).
- Toda carga de datos añade la zona con `withRegionParams(...)` y toda lista se filtra con `region.matches(item)`.
- Las noticias nacionales tienen departamento y municipio vacíos: deben seguir visibles al filtrar una zona.
- Los listados se muestran **agrupados por departamento → ciudad** (ver `relief-points-section`).
- Al añadir una entidad nueva con ubicación: expón `department` y `municipality` en el modelo y respeta lo anterior.

## 📱 Responsive (obligatorio)

**Ninguna pantalla se da por terminada si no funciona en un teléfono.** Se entra desde la calle,
con un celular en la mano y datos malos: el teléfono es la medida, no el escritorio.

- Se diseña primero a **360 px de ancho** y se revisa a 360, 768 y 1280 antes de dar algo por hecho.
- **Cero scroll horizontal.** Si la página se mueve de lado, está mal, sin excepciones.
- Nada de anchos mínimos mayores que la pantalla: en las rejillas usa
  `repeat(auto-fit, minmax(min(20rem, 100%), 1fr))`, nunca `minmax(20rem, 1fr)` a secas.
- Toda fila de botones, pestañas o filtros lleva `flex-wrap: wrap`. `white-space: nowrap`
  solo en etiquetas cortas que siempre caben; nunca en una fila entera de botones.
- Alturas: `min-height`, no `height` fija, en cualquier cosa que envuelva texto traducible
  (una etiqueta en inglés o en español no mide lo mismo).
- Zona de toque mínima de 44 px de alto y, en el teléfono, la acción principal ocupa el ancho.
- Puntos de corte del proyecto: **900 px** (tableta) y **640 px** (teléfono). Usa esos dos,
  no inventes otros salvo que un bloque concreto lo pida.
- Las medidas laterales van con `max(7vw, 28px)` en escritorio y bajan a `18px` en el teléfono.

## 🧾 Formularios

- Registrar una familia es público: nunca añadas correo, cuenta, inicio de sesión ni código de brigada.
  La prevención de abuso ocurre en la API y el caso nuevo se muestra como no verificado.
- El botón de enviar está **deshabilitado mientras el formulario no sea válido** y mientras se
  envía: no se ofrece un botón que no va a funcionar.
- Al lado del botón deshabilitado va siempre el aviso de qué falta (`common.requiredMissing`),
  para que se entienda por qué no se puede publicar todavía.

## ⏱️ Prohibido `setTimeout` (obligatorio)

**No se escribe `setTimeout`, `setInterval` ni `requestAnimationFrame` sueltos.** Es una espera a
ciegas: nadie la cancela, sobrevive al componente que la creó, no se prueba bien y esconde la
condición real por la que se está esperando detrás de un número de milisegundos inventado.

- Esperar un rato → `timer(ms)` o `delay(ms)` de RxJS, **siempre** con `takeUntilDestroyed()`.
- Agrupar una ráfaga de eventos → `debounceTime` / `auditTime`, nunca un temporizador propio.
- Esperar a que el navegador pinte → `afterNextRender` / `afterEveryRender`.
- Esperar el final de una animación o transición → los eventos `transitionend` / `animationend`.
- Un reloj que avanza en pantalla → `interval(ms)` de RxJS con `takeUntilDestroyed()`.
- Y antes que nada: espera **a la cosa**, no a un número. Un evento, una petición, un signal.
  Si no hay a qué esperar, casi siempre es que la condición está mal planteada.

## 🚫 Nada de tarjetas (obligatorio)

**No se diseñan más tarjetas.** Ni recuadros con borde y sombra, ni cajas dentro de cajas,
ni rejillas de _cards_. Es una decisión explícita del producto: la pantalla se llenaba de
marcos que compiten entre sí y el contenido dejaba de leerse.

- Para separar bloques usa **aire y una línea fina** (`border-top: 1px solid var(--line)`),
  no un contenedor con fondo, borde y sombra.
- Para listas usa **filas** separadas por línea, no una cuadrícula de recuadros.
- La jerarquía la marcan el tamaño y el peso del texto, y los rótulos en versalitas
  (`font-size: 10px; text-transform: uppercase; letter-spacing`), no el marco.
- El color de fondo se reserva para lo que de verdad es una alerta o un sello; nunca para
  "agrupar" información que ya está agrupada por su título.
- Un dato importante se destaca con una **viñeta** o una línea vertical de color a la
  izquierda, no metiéndolo en una caja.

## 🛡️ Sitios verificados

- `verifiedBy` y `verifiedAt` (puntos de ayuda y alojamientos) dicen quién comprobó el
  sitio y cuándo. Vacío significa **sin confirmar** y la interfaz lo advierte: a una
  dirección que nadie ha comprobado no se manda a una familia de noche.
- Muéstralo siempre como **viñeta de verificado** junto al nombre, no como un bloque de
  texto aparte.

## 📰 Noticias de desastres

- `/news` muestra únicamente novedades nacidas de desastres activos: afectaciones, censos,
  cierres, ayudas de emergencia y pasos concretos publicados por una fuente oficial.
- No mezcles programas sociales, trámites permanentes, convocatorias generales ni noticias de
  ciudad que no respondan directamente al desastre.
- El filtro principal es el tipo de desastre; las publicaciones vencidas no forman parte de la
  vista pública.

## 📡 Tiempo real

- Un solo socket por namespace mediante `RealtimeService.listen(namespace, handlers)`.
- Namespaces: `/reports`, `/relief-points`, `/meals`, `/alerts`, `/missing`, `/lodging`, `/convoys`,
  `/monitoring`, `/news`. Eventos: `<entidad>.<acción>`.
- Los servicios de `core/services` se suscriben en su constructor y hacen _upsert_ sobre su signal;
  los componentes nunca abren sockets.
