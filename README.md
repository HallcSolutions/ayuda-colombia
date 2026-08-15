# RedAyuda Colombia

Portal humanitario para registrar viviendas afectadas, fotografías, ubicación autorizada, puntos de acopio, comedores, alojamientos ofrecidos para dormir y necesidades de las familias. La consulta es pública; la creación y actualización requiere un código entregado a brigadistas o líderes autorizados, sin cuentas ni inicio de sesión.

## Estructura

- `frontend/`: Angular 22, español/inglés en tiempo real, formularios reactivos, geolocalización, directorio nacional y Socket.IO.
- `backend/`: NestJS 11, TypeORM, PostgreSQL, carga local de imágenes, Swagger, autorización por código y Socket.IO.

La ilustración de portada está en `frontend/public/assets/redayuda-colombia-hero.png`.

## Desarrollo local

1. En `backend/`, copia `.env.example` como `.env` y cambia `REPORTER_ACCESS_CODES`.
2. Ejecuta `docker compose up -d` dentro de `backend/`.
3. Ejecuta `npm install` y luego `npm run start:dev` dentro de `backend/`.
4. Ejecuta `npm install` y luego `npm start` dentro de `frontend/`.
5. Abre `http://localhost:4200`. La documentación de la API queda en `http://localhost:3000/api/docs`.

El código de demostración definido en `.env.example` es `brigada-demo-2026`. Debe reemplazarse antes de publicar el sistema.

## Contrato principal

- `GET /api/reports`: consulta pública.
- `POST /api/reports`: crea un reporte con `multipart/form-data` y encabezado `x-reporter-key`.
- `PATCH /api/reports/:id`: actualiza necesidades, urgencia o estado con código autorizado.
- `PATCH /api/reports/:id/location`: actualiza la ubicación con código autorizado.
- WebSocket `/reports`: eventos `report.created` y `report.updated`.
- `GET /api/relief-points`: directorio público de puntos de acopio, comedores, albergues y puestos de salud.
- `POST/PATCH /api/relief-points`: registro y actualización con código autorizado.
- `GET/POST/PATCH /api/meal-services`: jornadas y raciones entregadas.
- `GET/POST /api/alerts` y `PATCH /api/alerts/:id/resolve`: necesidades urgentes en tiempo real.
- `GET /api/missing`: consulta pública de personas y animales desaparecidos, filtrable por `kind`, `status`, `department` y `municipality`.
- `POST /api/missing`: publica una búsqueda con `multipart/form-data` (1 a 3 fotos). **No pide código**: quien busca a un familiar no es brigadista. Limitado a 10 publicaciones por minuto.
- `PATCH /api/missing/:id`: marca el reencuentro, cierra o reabre la búsqueda y corrige el contacto. Exige la cabecera `x-missing-pin` con el PIN que devolvió la publicación.
- WebSocket `/missing`: eventos `missing.created` y `missing.updated`.
- `GET /api/lodging`: consulta pública de dormidas ofrecidas, filtrable por `kind`, `status`, `onlyAvailable`, `department` y `municipality`.
- `POST /api/lodging`: publica un alojamiento con los cupos disponibles. **No pide código**: una familia, un hotel o un motel no son brigadistas. Limitado a 10 publicaciones por minuto.
- `PATCH /api/lodging/:id`: cambia contacto, condiciones, total de cupos o retira el ofrecimiento. Exige la cabecera `x-lodging-pin`.
- `PATCH /api/lodging/:id/occupancy`: mueve los cupos ocupados con `{ "delta": n }` (positivo ocupa, negativo libera). Exige la misma cabecera.
- WebSocket `/lodging`: eventos `lodging.created` y `lodging.updated`.
- `GET /api/convoys`: consulta pública de camiones que llevan ayuda, filtrable por `status`, `destinationPointId`, `department` y `municipality`.
- `POST /api/convoys`: anuncia un viaje. **No pide código**: quien presta su camión no es brigadista. Limitado a 10 anuncios por minuto.
- `POST /api/convoys/:id/pings`: envía la posición del camión. Exige la cabecera `x-convoy-pin` y que el viaje tenga el rastreo autorizado.
- `PATCH /api/convoys/:id`: enciende o apaga el rastreo, marca la llegada o cancela el viaje. Exige la misma cabecera.
- WebSocket `/convoys`: eventos `convoy.created`, `convoy.moved` y `convoy.updated`.
- `GET /api/monitoring/digest`: último resumen del chequeo periódico (acopios nuevos y qué falta).
- `GET /api/monitoring/status`: si el chequeo sigue vivo (última corrida, próxima y fallos seguidos).
- `GET /api/recovery/projects`: consulta pública de viviendas, negocios, restaurantes, ventas de calle, talleres y artesanos en recuperación.
- `POST /api/recovery/projects`: publica el caso y su oferta inmediatamente y entrega un PIN. El teléfono solo sale con autorización expresa; la dirección exacta nunca se publica.
- `POST /api/recovery/helpers`: registra privadamente identidad, oficio y soporte. Las tareas técnicas no aceptan postulaciones hasta clasificar su riesgo y comprobar el nivel requerido.
- `GET/PATCH /api/recovery/verification/*`: moderación posterior de casos y verificación previa de tareas y ayudantes, protegida por `RECOVERY_VERIFIER_KEY`.
- WebSocket `/recovery`: eventos `recovery.project.created` y `recovery.project.updated`.
- `POST /api/monitoring/digest/run`: genera el resumen a mano. Exige la cabecera `x-digest-token`.
- WebSocket `/monitoring`: evento `digest.created`.

## Chequeo cada 6 horas

Cada seis horas —a las 0, 6, 12 y 18, hora de Colombia— el API revisa la red sola y guarda un
resumen en `needs_digests`: qué acopios se registraron desde la última revisión y qué les sigue
faltando a los que ya estaban. Además de las alertas abiertas, agrupadas por punto y categoría,
levanta cuatro señales que no se ven mirando una alerta suelta: la **alerta crítica** que lleva más
de 24 horas sin que nadie la atienda, el **punto del que no se sabe nada** hace más de 48 (ni
alertas, ni comidas, ni ediciones), el **comedor sin ninguna jornada** de comida programada, y el
punto marcado como **lleno o cerrado** hace tanto que el dato ya no es creíble. El resumen sale por
el socket apenas se genera, así que la portada se actualiza sin recargar.

La ventana revisada no es «las últimas seis horas» sino **desde donde terminó la última corrida
buena**: si el contenedor se reinició o se redesplegó justo a esa hora, la corrida siguiente
recupera lo que se hubiera perdido. Las corridas que fallan también se guardan, porque un chequeo
muerto y un país sin novedades se ven igual desde fuera; `GET /api/monitoring/status` es lo que
distingue uno del otro.

Todo se configura por entorno (`DIGEST_*` en `.env.example`): cadencia, zona horaria, umbrales de
horas, retención y la llave del disparo manual. `DIGEST_ENABLED=false` lo apaga sin redesplegar.

### En Railway

- **Serverless (app sleeping) debe estar apagado** en el servicio: si el contenedor duerme, el reloj
  del chequeo se duerme con él. Con Serverless encendido, el respaldo es un reloj externo llamando a
  `POST /api/monitoring/digest/run` con `DIGEST_TRIGGER_TOKEN`.
- El resumen se genera **dentro del servicio web**, no como cron job de Railway: un cron de Railway
  exige que el proceso termine, y este tiene que seguir vivo para emitir por socket a quien esté
  mirando la página.
- Durante un redespliegue conviven el contenedor viejo y el nuevo unos segundos. Si el reloj cae ahí,
  los dos intentarían generar el resumen: lo impide un `advisory lock` de Postgres, que se toma sobre
  una conexión propia porque el candado pertenece a la sesión y el pool reparte conexiones distintas.
- El contenedor corre en UTC, así que la imagen instala `tzdata` y fija `TZ=America/Bogota`. Colombia
  no tiene horario de verano, de modo que el desfase es siempre de cinco horas.

## Camiones en ruta

La pestaña «Camiones» sirve para que un punto de acopio sepa qué le viene y a qué hora llega. Quien va a llevar ayuda anuncia su viaje sin cuenta ni código: nombre, teléfono, vehículo, qué lleva, desde qué ciudad sale y a qué punto va. La respuesta entrega **una sola vez** un PIN de 6 dígitos, guardado solo como `scrypt` con salt.

El rastreo es voluntario y explícito: solo si quien conduce marca «compartir mi ubicación en vivo» el navegador empieza a enviar su posición cada 15 segundos con ese PIN. Sobre el mapa se dibujan dos trazos: el camino ya recorrido, punto por punto según lo reportó el GPS, y en punteado la carretera que falta. Cada señal viaja por socket, así que el mapa y la hora de llegada se mueven en vivo en la pantalla del acopio.

La carretera que falta la calcula un motor de rutas OSRM (`ROUTING_URL`), y se vuelve a pedir solo cuando el camión se desvía más de 3 km o cuando la ruta guardada cumple seis minutos; entre tanto se recorta sobre la ruta ya calculada. La hora estimada sale de esos kilómetros reales a la velocidad media que el camión trae de verdad, con 45 km/h de referencia mientras esté detenido. Si el motor no responde, el viaje no se cae: la distancia se mide en línea recta con un factor de carretera y la tarjeta lo dice.

Al entrar a 400 metros del punto, el viaje se marca como llegado solo; también puede marcarse a mano. Apagar el rastreo borra el camino recorrido, y el de los viajes terminados se borra a las 12 horas: por dónde anduvo una persona no se guarda para siempre.

## Dónde dormir

La pestaña «Dónde dormir» recoge lo que ofrece la gente para pasar la noche: casas de familia, hoteles, moteles, hostales y fincas. Cada publicación dice el nombre del lugar, cuántas personas caben, dirección o referencia, quién recibe, teléfono y WhatsApp, máximo de noches, si es gratis y si acepta mascotas. Publicar y consultar es abierto, sin cuenta ni código de brigadista.

Los cupos van mermando: quien ofrece la dormida descuenta los que se van ocupando y los libera cuando la familia se va, y la tarjeta muestra siempre cuántos quedan libres de cuántos. Cuando la ocupación llega al total, el alojamiento pasa solo a «sin cupos», y vuelve a «con cupos» al liberar alguno. La suma la hace la base de datos en una sola sentencia, así que dos brigadas ubicando familias a la vez no se pisan ni dejan el cupo en negativo.

Al publicar, la respuesta entrega **una sola vez** un PIN de 6 dígitos: es la llave para descontar cupos, liberarlos o retirar el ofrecimiento. Se guarda solo como `scrypt` con salt, nunca sale por el listado ni por el socket, y sin él las actualizaciones responden 401.

## Personas y animales desaparecidos

La pestaña «Desaparecidos» publica un aviso por caso: foto, nombre, edad aproximada, señas para reconocerlo, departamento y municipio, dónde y cuándo se le vio por última vez, y a quién llamar (teléfono y WhatsApp). Cualquier persona puede publicar y consultar sin cuenta ni código de brigadista; el aviso solo exige marcar la autorización para publicar foto y contacto. Marcar «encontrado» guarda la fecha del reencuentro y se puede reabrir la búsqueda si hace falta.

Al publicar, la respuesta entrega **una sola vez** un PIN de 6 dígitos que solo ve quien creó el aviso: es la llave para marcarlo como encontrado, cerrarlo o reabrirlo. De él únicamente se guarda un `scrypt` con salt, nunca sale por el listado ni por el socket, y sin él el `PATCH` responde 401. Si alguien lo pierde, hoy la única salida es actuar sobre la base de datos.

## Datos verificados

`npm run db:seed` en `backend/` carga de forma idempotente 24 puntos de acopio corroborados para la emergencia del 10 de agosto de 2026, con dirección, coordenadas, responsable, horario conocido, necesidades, fecha de verificación y fuente. La carga cubre Antioquia, Atlántico, Bogotá D.C., Bolívar, Cauca, Risaralda y Valle del Cauca; también crea una alerta activa por punto con los elementos solicitados.

Las fuentes principales son el directorio colaborativo [Terremoto.com.co](https://terremoto.com.co/collection-points), la [guía de ayuda de EL PAÍS](https://elpais.com/america-colombia/2026-08-10/como-ayudar-a-las-personas-damnificadas-por-el-terremoto-en-colombia.html), su [recopilación de iniciativas nacionales](https://elpais.com/america-colombia/2026-08-12/la-columna-mas-aburrida-del-mundo.html) y publicaciones de las entidades operadoras. Los avisos sin dirección precisa, sin corroboración o que reportaban no estar recibiendo ayudas no se cargaron como activos.

La consulta oficial de eventos sísmicos debe hacerse en el Servicio Geológico Colombiano. Antes de publicar un punto de ayuda, confirma su vigencia con la UNGRD, la alcaldía, gobernación o entidad operadora correspondiente.

Las fotos se guardan en `backend/uploads/` durante desarrollo. Para producción se recomienda almacenamiento de objetos compatible con S3 y códigos rotables administrados como secretos.
