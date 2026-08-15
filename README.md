# RedAyuda Colombia

Portal humanitario creado para responder al desastre natural del 10 de agosto de 2026 en Colombia. Conecta directamente a familias afectadas con personas que quieren ayudarlas: RedAyuda no recibe, retiene ni reparte dinero. Consultar y registrar familias es público, sin correo, cuentas, inicio de sesión ni códigos de brigada.

El registro de una familia no exige cédula, fotografías ni GPS. Solo pide la zona, las necesidades actuales y un contacto cercano para coordinación. El nombre y teléfono se muestran al público únicamente con autorización expresa; las fotos y la ubicación exacta siguen siendo opcionales. Cada publicación nueva aparece como no verificada: la plataforma no traslada esa carga a quienes acaban de perderlo todo ni inventa una verificación automática.

## Estructura

- `frontend/`: Angular 22, español/inglés en tiempo real, formularios reactivos, geolocalización, directorio nacional y Socket.IO.
- `backend/`: NestJS 11, TypeORM, PostgreSQL, carga local de imágenes, Swagger, controles de abuso y Socket.IO.

La ilustración de portada está en `frontend/public/assets/redayuda-colombia-hero.png`.

## Desarrollo local

1. En `backend/`, copia `.env.example` como `.env`.
2. Ejecuta `docker compose up -d` dentro de `backend/`.
3. Ejecuta `npm install` y luego `npm run start:dev` dentro de `backend/`.
4. Ejecuta `npm install` y luego `npm start` dentro de `frontend/`.
5. Abre `http://localhost:4200`. La documentación de la API queda en `http://localhost:3000/api/docs`.

## Contrato principal

- `GET /api/reports`: consulta pública.
- `POST /api/reports`: registra públicamente una familia con `multipart/form-data`; no pide correo, cuenta ni código. Cédula, fotos y GPS son opcionales y el abuso se limita por IP.
- Los reportes no exponen un `PATCH` público: otra persona no puede cambiar o cerrar el caso desde el directorio.
- WebSocket `/reports`: evento `report.created`.
- `GET /api/relief-points`: directorio público de puntos de acopio, comedores, albergues y puestos de salud.
- `POST/PATCH /api/relief-points`: registro y actualización con código autorizado.
- `GET/POST/PATCH /api/meal-services`: jornadas y raciones entregadas.
- `GET/POST /api/alerts` y `PATCH /api/alerts/:id/resolve`: necesidades urgentes en tiempo real.
- `GET /api/missing`: consulta pública de personas y animales desaparecidos, filtrable por `kind`, `status`, `department` y `municipality`.
- `POST /api/missing`: publica una búsqueda con `multipart/form-data` (1 a 3 fotos). **No pide código**: quien busca a un familiar no es brigadista. Limitado a 10 publicaciones por minuto.
- `POST /api/missing/verified`: crea o refresca de forma idempotente un aviso contrastado de persona o animal con `x-missing-publisher-key`. Solo acepta dominios institucionales permitidos y enlaza la ficha original sin copiar fotos ni teléfonos privados.
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
- `GET /api/news`: boletines de desastres activos, filtrables por `category`, `department` y `municipality`; las emergencias nacionales siempre acompañan el resultado y las publicaciones vencidas se ocultan.
- `POST/PATCH /api/news`: publicación editorial con la cabecera `x-news-publisher-key`. Solo admite categorías de desastre (sismo, inundación, deslizamiento, incendio, tormenta, sequía u otro); no es un directorio de programas generales.
- `GET /api/recovery/projects`: casos verificados de recuperación tras el terremoto, con tareas revisadas y oferta local de artesanos, restaurantes, ventas ambulantes y pequeños negocios.
- `POST /api/recovery/projects`: registra un caso o negocio para revisión y entrega un PIN. El contacto solo se publica para pedidos cuando el titular lo autoriza; documentos y direcciones exactas nunca salen en el listado.
- `POST /api/recovery/helpers`: registra privadamente identidad, oficio y soporte. Nadie puede postularse hasta que el equipo asigne un nivel comprobado.
- `GET/PATCH /api/recovery/verification/*`: cola privada protegida por `x-recovery-verifier-key` para confirmar casos, clasificar riesgos y contrastar referencias, certificados o matrículas.
- WebSocket `/recovery`: eventos `recovery.project.created` y `recovery.project.updated`, únicamente para proyectos aprobados.
- `POST /api/monitoring/digest/run`: genera el resumen a mano. Exige la cabecera `x-digest-token`.
- WebSocket `/monitoring`: evento `digest.created`.

## Manos a la obra después del terremoto

La pestaña «Recuperación» reúne dos acciones que deben ocurrir juntas: volver seguro y habitable
un lugar afectado, y devolverle ingresos a quien vivía de él. Una vivienda, restaurante, venta de
calle, taller o negocio artesanal registra su historia, zona aproximada y una primera tarea. Si
todavía puede vender, también publica productos, comidas, horarios, modalidades de entrega y —solo
con autorización expresa— un teléfono para pedidos.

Nada se publica automáticamente. Casos, tareas y ayudantes entran a una cola privada protegida por
`RECOVERY_VERIFIER_KEY`. El equipo llama al responsable, comprueba que el caso exista y asigna el
riesgo de cada labor. Estructura, electricidad y gas nunca pueden quedar por debajo de riesgo rojo;
solo admiten perfiles cuya matrícula o licencia fue contrastada en un registro oficial. Construcción,
plomería, carpintería, soldadura y reparación de equipos exigen un oficio respaldado por certificado
o referencia comprobada. Incluso las labores de riesgo bajo requieren identidad y teléfono
confirmados.

Asignar el nivel profesional exige dejar el nombre y el enlace HTTPS de la consulta realizada. El
backend solo acepta dominios incluidos en `RECOVERY_TRUSTED_REGISTRY_DOMAINS`; si la lista está
vacía, no concede ese nivel. La configuración de ejemplo incluye
[COPNIA](https://www.copnia.gov.co/atencion-al-ciudadano/consultas-en-linea) para ingeniería,
profesiones afines y maestros de obra, y [CONTE](https://www.conte.org.co/consultas/) para técnicos
electricistas. El equipo debe revisar esa lista y
confirmar que la clase o alcance de la matrícula corresponda exactamente a la tarea, no solo que el
número exista. La fuente queda visible para el responsable del caso, pero el enlace consultado se
mantiene en la cola privada porque puede contener datos personales.

Los documentos, referencias, teléfonos de voluntarios y contactos de viviendas no forman parte del
contrato público ni viajan por Socket.IO. El dueño del caso solo conoce el contacto de quien se
postuló al abrir la gestión con su PIN; la persona ayudante solo recibe el contacto del responsable
después de ser aceptada. La ubicación exacta se acuerda fuera del directorio.

En restaurantes y ventas de comida, la insignia de verificación solo confirma identidad, contacto y
existencia del caso. La interfaz advierte expresamente que no reemplaza una inspección sanitaria ni
garantiza la inocuidad de los alimentos.

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

`npm run db:seed` en `backend/` carga de forma idempotente los 73 lugares corroborados para la emergencia del 10 de agosto de 2026: 70 abiertos y 3 cierres conservados como historial. Incluye acopios, albergues, bancos de alimentos, 11 puestos médicos de Cali y 4 centros veterinarios en 17 departamentos o distritos, con dirección, coordenadas, responsable, horario, fecha de verificación y fuentes públicas completas. Solo crea alertas para los 44 puntos que publicaron necesidades vigentes y cierra cualquier alerta residual de un lugar cerrado.

Las fuentes principales son el directorio colaborativo [Terremoto.com.co](https://terremoto.com.co/collection-points), la [guía de ayuda de EL PAÍS](https://elpais.com/america-colombia/2026-08-10/como-ayudar-a-las-personas-damnificadas-por-el-terremoto-en-colombia.html), su [recopilación de iniciativas nacionales](https://elpais.com/america-colombia/2026-08-12/la-columna-mas-aburrida-del-mundo.html) y publicaciones de las entidades operadoras. Los avisos sin dirección precisa, sin corroboración o que reportaban no estar recibiendo ayudas no se cargaron como activos.

La consulta oficial de eventos sísmicos debe hacerse en el Servicio Geológico Colombiano. Antes de publicar un punto de ayuda, confirma su vigencia con la UNGRD, la alcaldía, gobernación o entidad operadora correspondiente.

Las fotos se guardan en `backend/uploads/` durante desarrollo. Para producción se recomienda almacenamiento de objetos compatible con S3 y códigos rotables administrados como secretos.
