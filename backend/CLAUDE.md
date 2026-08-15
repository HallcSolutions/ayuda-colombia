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

- `clean-code`
- `minimal-implementation`
- `solid-principles`
- `modular-architecture`
- `mutation-testing`
- `nestjs-best-practices`

<!-- chalc:end -->

## 🧱 Módulos del dominio

| Módulo          | Ruta base            | Para qué                                                                                      |
| --------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `reports`       | `/api/reports`       | Viviendas afectadas, con fotos y ubicación.                                                   |
| `relief-points` | `/api/relief-points` | Puntos de acopio, comedores, albergues y puestos de salud.                                    |
| `meals`         | `/api/meal-services` | Jornadas de comida por punto (raciones planeadas vs entregadas).                              |
| `alerts`        | `/api/alerts`        | Alertas de necesidad de un punto; se difunden a toda la red.                                  |
| `missing`       | `/api/missing`       | Personas y animales desaparecidos, con foto, último avistamiento y contacto.                  |
| `lodging`       | `/api/lodging`       | Dormidas ofrecidas por familias, hoteles y moteles: cupos que se ocupan y se liberan.         |
| `convoys`       | `/api/convoys`       | Camiones que llevan ayuda a un acopio: recorrido en vivo y hora de llegada.                   |
| `news`          | `/api/news`          | Boletines oficiales ligados exclusivamente a desastres activos, por departamento y municipio. |

Reglas: un módulo = una carpeta con `*.controller.ts`, `*.service.ts`, `*.gateway.ts`, `dto/` e
`infrastructure/entities/`. Los contratos que salen por la API viven en `common/interfaces` y **nunca**
se expone la entidad de TypeORM directamente: cada servicio tiene su `toContract`.

## 📸 Fotos

Los módulos que reciben imágenes (`reports`, `missing`) comparten `common/uploads/photo-upload.ts`:
`photoUploadOptions` para el `FilesInterceptor` y `photoUrl(file)` para la ruta pública. El máximo de
archivos lo decide cada módulo con su constante (`MAX_REPORT_PHOTOS`, `MAX_MISSING_PHOTOS`); el tipo
permitido y el tamaño máximo son únicos para toda la API.

## 🗄️ Base de datos

- PostgreSQL en Docker (`npm run db:up`). El compose declara `name: redayuda`; **no lo quites**,
  o Compose usa el nombre de la carpeta (`backend`) y borra los contenedores de otros proyectos del monorepo.
- La conexión se define una sola vez en `src/common/database/database.config.ts` y la comparten
  `app.module.ts` y el CLI (`src/common/database/data-source.ts`).
- **`synchronize` está desactivado: el esquema solo cambia con migraciones** (`src/migrations/`).
  Si tocas una entidad, corre `npm run migration:generate -- src/migrations/NombreDelCambio`,
  revisa el SQL y comitea la migración junto al cambio.
- La app aplica migraciones pendientes al arrancar (`DB_RUN_MIGRATIONS=false` para desactivarlo).
- `scripts/seed.ts` (`npm run db:seed`) siembra datos de ejemplo de varios departamentos y es idempotente:
  si ya hay puntos, no hace nada.
- `scripts/` está excluido de `tsconfig.build.json`: si se incluye, `nest build` mueve la salida a
  `dist/src/` y `npm run start:prod` deja de encontrar `dist/main`.

## 🗺️ Cobertura nacional (departamento y ciudad)

La ayuda se coordina por departamento y municipio en todo el país, no en una sola ciudad.

- Filtro compartido: `common/database/region-filters.ts` (`RegionFilters` + `applyRegionFilters`).
- **Todo endpoint de listado con ubicación debe aceptar `department` y `municipality`** y resolverlos con ese
  helper, sobre la propia tabla (`reports`, `relief_points`) o sobre el punto relacionado (`alerts`, `meals`).
- `ReliefPointSummary` incluye `department` y `municipality` para que una alerta diga siempre dónde ocurre.
- Los listados se ordenan por departamento → municipio → nombre.
- Si el endpoint valida la query con un DTO (`FindReportsQueryDto`), añade ahí el campo:
  el `ValidationPipe` global usa `forbidNonWhitelisted`, así que un parámetro no declarado devuelve 400.

## 📡 Tiempo real

- Un gateway por módulo, namespace `/<módulo>`, eventos `<entidad>.<acción>`
  (`alert.created`, `alert.resolved`, `relief-point.updated`, `meal-service.created`).
- El servicio emite **después** de persistir y siempre el contrato ya mapeado, nunca la entidad.

## 🔑 Escrituras públicas y protección

- `POST /reports` es público y no pide correo, cuenta, inicio de sesión ni código de brigada. Se protege
  con `@Throttle`; cada caso nuevo queda `fieldVerified: false` hasta que exista una comprobación real.
  No añadas una llave compartida ni marques el caso como verificado solo por haber llenado el formulario.
- No expongas un `PATCH /reports` público sin un mecanismo privado perteneciente al propio caso: cualquier
  visitante podría cerrar o alterar la solicitud. La ausencia de edición es preferible a un código general.
- `news` usa una llave editorial separada (`NEWS_PUBLISHER_KEY` en `x-news-publisher-key`) para que
  solo fuentes verificadas lleguen al directorio público. No publiques allí subsidios, trámites o
  convocatorias generales: cada entrada debe corresponder a un sismo, inundación, deslizamiento,
  incendio forestal, tormenta, sequía u otro desastre activo.
- `missing`, `convoys` y `lodging` también son públicos al crear. El abuso se contiene con `@Throttle`
  y con los máximos de cada módulo.
- Editar esas publicaciones sí está protegido, pero con su propia llave: al crearlas se genera un PIN de
  6 dígitos (`common/security/edit-pin.ts`) que se devuelve **una sola vez** en la respuesta y del que
  solo se guarda `salt:hash` de `scrypt`. El `PATCH` lo exige en la cabecera `x-missing-pin`,
  `lodging` en `x-lodging-pin`, y en `convoys` también el `POST` de posiciones con `x-convoy-pin`.
  El PIN nunca aparece en el listado ni en los eventos del gateway: solo en `PublishedMissingRecord`,
  `PublishedConvoyTrip` y `PublishedLodgingOffer`.

## 🛏️ Dormidas ofrecidas (`lodging`)

- `status` no se elige a mano salvo para `closed`: `available` y `full` los deduce la ocupación en
  `resolveStatus`, así que reabrir un alojamiento sin cupos lo deja en `full`.
- Los cupos se mueven solo por `PATCH /:id/occupancy` con un `delta` (positivo ocupa, negativo libera).
  La suma se hace **dentro del UPDATE** (`LEAST(GREATEST(...))`): dos brigadas ubicando familias a la
  vez no se pisan y el valor nunca sale de `[0, totalSpaces]`. No lo cambies por leer, sumar y guardar.
- Bajar `totalSpaces` arrastra la ocupación hacia abajo: nunca puede quedar por encima del total.

## 🚚 Camiones en ruta (`convoys`)

- Rastrear es decisión de quien conduce: sin `shareLocation` el viaje se anuncia, pero `POST /pings`
  responde 403 y no se guarda ni una coordenada. Retirar el permiso borra las migas ya guardadas.
- El camino recorrido son filas de `convoy_pings` (una por avance real); lo que falta es la carretera que
  devuelve `RoutingService`. Es la **única** llamada del backend a un servicio externo: si falla, no
  propaga el error, se mide en línea recta con castigo de carretera y el contrato lo declara en
  `routeSource`. Se configura con `ROUTING_URL` y `ROUTING_ENABLED`.
- Las migas de un viaje terminado se borran a las horas de retención (`purgeExpiredTrails`): el rastro de
  por dónde anduvo una persona no se guarda para siempre.

## 🌐 Idiomas

- El texto que ve la persona usuaria se traduce en el frontend (`core/i18n`), que es donde está el catálogo
  ES/EN. Los mensajes de excepción de la API son operativos y se mantienen en español; si algún día se
  negocian por `Accept-Language`, hazlo en un filtro de excepciones, no repartiendo textos por los servicios.
