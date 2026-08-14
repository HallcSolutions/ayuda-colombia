# RedAyuda Colombia — API

API humanitaria para coordinar, por departamento y municipio, viviendas afectadas, puntos de acopio,
comedores y alertas de necesidad en tiempo real.

## Puesta en marcha

```bash
npm install
cp .env.example .env        # ajusta credenciales si hace falta
npm run db:up               # levanta Postgres 16 en el puerto 5434
npm run migration:run       # crea el esquema
npm run db:seed             # puntos de acopio verificados (idempotente)
npm run start:dev           # API en http://localhost:3000/api (docs en /api/docs)
```

Al arrancar, la aplicación corre las migraciones pendientes por sí sola.
Para desactivarlo (por ejemplo, en un despliegue donde se aplican aparte) usa `DB_RUN_MIGRATIONS=false`.

## Base de datos

- Motor: PostgreSQL 16 (`docker-compose.yml`, proyecto de Compose `redayuda`, volumen `redayuda_postgres_data`).
- **El esquema solo cambia con migraciones versionadas.** `synchronize` está desactivado siempre.
- Conexión definida una sola vez en `src/common/database/database.config.ts`, compartida por la app y el CLI.

| Tabla | Contenido | Índices |
| --- | --- | --- |
| `house_reports` | Viviendas afectadas, necesidades, fotos y ubicación | `(department, municipality)`, `(status, createdAt)` |
| `relief_points` | Acopios, comedores, albergues y puestos de salud | `(department, municipality)`, `(status, type)` |
| `meal_services` | Jornadas de comida por punto (FK con `ON DELETE CASCADE`) | `(reliefPointId, servedOn)` |
| `aid_alerts` | Alertas de necesidad por punto (FK con `ON DELETE CASCADE`) | `(status, createdAt)` |

### Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run db:up` / `npm run db:down` | Levanta o apaga Postgres con Docker |
| `npm run migration:generate -- src/migrations/NombreDelCambio` | Genera una migración con la diferencia entre entidades y base |
| `npm run migration:run` | Aplica las migraciones pendientes |
| `npm run migration:revert` | Revierte la última migración |
| `npm run migration:show` | Lista qué migraciones están aplicadas |
| `npm run db:seed` | Crea o actualiza puntos y alertas corroborados, sin duplicarlos |
| `npm run db:reset` | Borra el esquema, migra de nuevo y siembra |

Cada vez que cambies una entidad, genera la migración correspondiente y súbela con el cambio:
sin ella, otras personas y el despliegue se quedan con el esquema viejo.

## ¿La están usando?

```bash
npm run uso                                # la base local; `npm run uso -- 30` para 30 días
railway run --service Postgres npm run uso # producción, desde tu máquina
```

Solo lee. Separa **publicar** (entrar una vez y dejar un dato) de **volver** (ocupar un cupo,
cerrar una alerta, mover un camión, comprobar un sitio): una base llena de publicaciones y sin
señales de vuelta significa que la página se ve pero no sirve. Avisa además de las cargas
masivas para que una siembra no se lea como un día de uso intenso.

Lo que **no** mide: cuánta gente entra a mirar. Eso hoy no se guarda en ninguna parte.

## Pruebas

```bash
npm test          # unitarias
npm run test:e2e  # extremo a extremo
```
