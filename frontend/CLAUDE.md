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
- Los listados se muestran **agrupados por departamento → ciudad** (ver `relief-points-section`).
- Al añadir una entidad nueva con ubicación: expón `department` y `municipality` en el modelo y respeta lo anterior.

## 🚫 Nada de tarjetas (obligatorio)

**No se diseñan más tarjetas.** Ni recuadros con borde y sombra, ni cajas dentro de cajas,
ni rejillas de *cards*. Es una decisión explícita del producto: la pantalla se llenaba de
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

## 📡 Tiempo real

- Un solo socket por namespace mediante `RealtimeService.listen(namespace, handlers)`.
- Namespaces: `/reports`, `/relief-points`, `/meals`, `/alerts`, `/missing`, `/lodging`, `/convoys`,
  `/monitoring`. Eventos: `<entidad>.<acción>`.
- Los servicios de `core/services` se suscriben en su constructor y hacen *upsert* sobre su signal;
  los componentes nunca abren sockets.
