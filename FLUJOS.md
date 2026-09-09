# Flujos del sistema

Versión en texto de los flujos reales de TC CARS, para tenerla versionada junto al código. La versión visual (diagramas) vive en este artefacto: https://claude.ai/code/artifact/9e484576-7fc7-46ee-88ec-20adf7311ab0

**Estado**: en producción en `https://tccars.cl` (Vercel, deploy automático en cada push a `main`). Google Drive configurado y verificado. **Pendiente real**: Resend tiene el dominio verificado pero los envíos siguen fallando por un bug de su backend (ver `FALTANTES.md`, punto 2) — ningún correo real llega mientras eso no se resuelva.

## Búsqueda y paginación en todas las listas

Toda lista administrable que puede crecer (mantenciones por vehículo, colaboradores, clientes, vehículos, productos, servicios, proveedores, referencias, mensajes de contacto, cotizaciones) usa el mismo patrón, con dos componentes reutilizables (`src/components/admin/list-search.tsx` y `list-pagination.tsx`):

- **Búsqueda instantánea**: a partir de 2 letras, sin botón "Buscar" — filtra sola 300ms después de dejar de escribir (debounce), actualizando `?q=` en la URL. El filtro se hace en el servidor (Prisma `contains`, insensible a mayúsculas), no trayendo todo a memoria.
- **Paginación**: 20 resultados por página, con "Anterior/Siguiente" que conservan la búsqueda activa (`?q=...&page=...`).
- Contabilidad es la excepción: usa filtros estructurados (rango de fechas, colaborador, estado de pago) en vez de búsqueda por texto, porque no encaja en ese molde — pero ya tenía paginación de antes.

**Ancho de página en `/admin`, `/colaborador` y `/mi-cuenta`**: cada una de esas tres secciones tiene ahora su propio `layout.tsx` con un simple `<div className="w-full">`. Sin él, la página quedaba como hijo directo del `<body>` raíz (que es `flex flex-col`) y el `mx-auto max-w-*` de cada página se encogía al ancho de su contenido en vez de estirarse — un bug de flexbox (un ítem flex con margin auto no hace stretch), notorio sobre todo en páginas con poco contenido como `/admin/mensajes` y `/admin/cotizaciones`, donde el buscador se veía angosto y el placeholder se cortaba.

## Autenticación y roles

Registro → `User` creado + email de verificación (Resend) → clic en el link → `emailVerified = true` → login con Credentials → se valida `active` (lo controla solo ADMIN) → redirect según rol (`ADMIN` → `/admin`, `COLLABORATOR` → `/colaborador`, `CLIENT` → `/mi-cuenta`). Recuperar contraseña usa un token de un solo uso enviado por email. El registro exige aceptar la política de privacidad (`/politica-privacidad`) con un checkbox obligatorio (`privacyAccepted`). Login (`src/auth.ts`) rechaza a cualquiera sin `emailVerified`, sin excepción.

**Si el correo de verificación no llega** (nuevo, 2026-09-08 — respaldo mientras dure el bug de Resend, ver `FALTANTES.md` punto 2): la cuenta igual se crea, con un mensaje honesto en vez de "revisa tu correo". Como esa persona no tiene otra forma de conseguir el link (a diferencia de un cliente creado por el taller, que ya queda verificado al tiro), `/admin/clientes` muestra un badge "Correo sin verificar" y un botón "Verificar correo" (`verifyClientEmailAction`) que marca `emailVerified` directamente, sin token ni depender de Resend — deja al cliente listo para iniciar sesión de inmediato.

## Vehículos y clientes

El colaborador busca un cliente existente o crea uno nuevo (password temporal + email de invitación) en el mismo formulario. Luego llena patente/marca/modelo/año/color. La patente es única en todo el sistema (índice único de Prisma + validación de formato en `vehicleSchema`); 1 cliente puede tener N vehículos, cada vehículo pertenece a un solo cliente.

**Link de invitación sin depender del correo** (nuevo, 2026-09-08): tanto al crear un cliente nuevo (aquí) como un colaborador nuevo (`/admin/colaboradores/nuevo`), el link para crear la contraseña (válido 48h) ahora se **muestra directo en pantalla** con un botón "Copiar link", además de intentar mandarlo por correo. Antes solo se imprimía en la consola del servidor en desarrollo — en producción, si el correo fallaba (como está pasando ahora con el bug de Resend), no había ninguna forma de recuperar ese link. Ahora el ADMIN/colaborador siempre lo tiene a mano para mandarlo por WhatsApp u otro medio.

**Restablecer contraseña de un colaborador existente**: en `/admin/colaboradores`, botón **"Link de contraseña"** por fila — genera un link nuevo (48h), lo copia solo al portapapeles, e intenta mandarlo por correo. Mismo respaldo que al crear, pero para alguien que ya tiene cuenta y olvidó su contraseña. **No existe todavía el equivalente para clientes** — no hay una pantalla `/admin/clientes` que los liste fuera del buscador embebido en "Registrar vehículo"; un cliente que pierde su contraseña solo puede pedirla él mismo desde `/olvide-contrasena` (que también depende de Resend).

## Mantención: dos orígenes

- **Web**: el colaborador llena el formulario en `/colaborador/mantenciones/nueva`.
- **WhatsApp + n8n**: el colaborador manda un audio, n8n lo transcribe y llama `POST /api/n8n/mantenciones` (resuelve vehículo por patente y colaborador por teléfono). La mantención queda en **`EN_PROCESO`** por defecto — no se cierra sola. Puede durar días así, mientras el colaborador la trabaja. Si n8n nunca manda un cierre explícito, se queda en `EN_PROCESO` indefinidamente (no hay cierre automático por tiempo).

**Cerrarla por voz, sabiendo cuál (si hay varias abiertas)**: el colaborador dice la patente (y n8n ya sabe su teléfono desde WhatsApp) → n8n llama `GET /api/n8n/mantenciones?patente=X&collaboratorPhone=Y`, que devuelve las mantenciones `AGENDADA`/`EN_PROCESO` de ese auto (folio, descripción, quién la tiene). Si hay una sola, n8n la cierra directo. Si hay varias, **desambigua combinando fecha y descripción, no por folio** — el colaborador nunca supo ese número, pero la fecha es lo más decidor porque siempre es distinta (la descripción sola puede repetirse, ej. dos "cambio de aceite" del mismo auto en fechas distintas): n8n le lee de vuelta ambas cosas ("tienes abierta una de hace 3 días sobre 'cambio de aceite' y otra de hoy sobre 'ruido en el motor', ¿cuál terminaste?"). El folio queda solo como referencia interna para el ADMIN en contabilidad. Con el `maintenanceId` resuelto, llama `PATCH /api/n8n/mantenciones/:id` con `status: "COMPLETADA"` y los costos finales — el merge preserva los costos ya cargados, no los resetea a 0.

Ambos caminos crean/actualizan el mismo modelo `Maintenance`, visible en el mismo historial.

**Fotos**: hasta 20 imágenes por mantención (`MAX_IMAGES_PER_MAINTENANCE`); el botón de subida desaparece al llegar al límite. Cada foto se comprime automáticamente en el navegador antes de subirse (reescalada a 1600px máx., recomprimida a JPEG ~75% de calidad, ~100-250 KB resultante) para no gastar espacio de UploadThing con fotos de celular de varios MB. La galería siempre se sirve desde UploadThing; además, cada foto se respalda automáticamente en Drive en segundo plano (nuevo, 2026-09-09), en la misma carpeta de la ficha de esa visita — ver sección "Ficha PDF descargable" más abajo.

## Ficha PDF descargable

En `/api/fichas/[maintenanceId]/route.ts`:
1. Si `fichaDriveFileId` está enlazado (lo hace n8n vía `POST /api/n8n/fichas`) → intenta descargar el PDF real desde Google Drive.
2. Si no hay ficha de Drive enlazada, **o si el intento de descargarla falla por cualquier motivo** (credenciales no configuradas, Drive caído, archivo borrado o no compartido) → genera el PDF al vuelo con `renderFichaPdf`, mismo formato que las fichas reales del taller. El cliente nunca se queda sin poder descargar algo solo porque Drive falló.
3. Ese PDF propio solo se genera si `status === "COMPLETADA"` — si no, 409 "disponible cuando esté completada".

**Fecha de la ficha**: `completedAt`/`startedAt` nunca se setean en ningún flujo (ni web ni n8n) — son campos del modelo que quedan siempre en `null`. Por eso la fecha que se muestra en el PDF usa `scheduledAt` (el único campo de fecha que el colaborador realmente llena) como primera opción, con `completedAt`/`createdAt` como respaldo si no hay `scheduledAt`. Antes del 2026-09-08 usaba solo `completedAt ?? createdAt`, lo que hacía que **toda** ficha mostrara la fecha en que se creó el registro en la base (normalmente "hoy"), no la fecha real del servicio — se corrigió tras detectarlo en una prueba con datos reales.

**Enviar la ficha por correo o WhatsApp** (nuevo, 2026-09-08): en `/colaborador/mantenciones/:id`, junto al botón "Descargar ficha":
- **"Enviar por correo"** — manda el mismo PDF (Drive o generado) como adjunto al correo del cliente, vía Resend. Sujeto a que Resend esté entregando correos de verdad (ver bug abierto en `project_tccars_pending.md`).
- **"Compartir por WhatsApp"** — genera (la primera vez que se pide) un `shareToken` aleatorio de 32 bytes guardado en la mantención, y abre `wa.me/<teléfono del cliente>` con un link público `/api/fichas/:id/compartir?token=...` que sirve el PDF **sin necesidad de login** (protegido solo por lo impredecible del token, igual que un link "cualquiera con el link" de Google Drive). Este link nunca expira ni se puede listar — solo funciona si se conoce el token exacto.
- Ambos reutilizan la misma lógica de resolución de archivo (`resolveFichaFile`) que el botón de descarga normal, así que los tres caminos siempre entregan exactamente el mismo PDF.

**Respaldo automático a Drive de la ficha del sitio** (nuevo, 2026-09-09, probado en producción — ver `FALTANTES.md` punto 1b): cada vez que se genera el PDF propio (caso 2 de arriba, sin `fichaDriveFileId` de n8n), en paralelo y sin bloquear la entrega se sube/sobrescribe una copia espejo en Drive, usando credenciales OAuth propias del sitio (distintas de la cuenta de servicio de solo lectura). Convención de carpetas (reemplaza la vieja `PATENTE/fichas/`+`PATENTE/fotos/`, detalle en `N8N.md` sección 3.4):

```
Fichas TC Cars/<PATENTE>/<AAAA-MM-DD>-<tipo>/ficha.pdf
```

El ID queda en `fichaDriveBackupFileId` (campo separado de `fichaDriveFileId`, que sigue siendo del flujo de voz de n8n) y se reutiliza siempre para sobrescribir el mismo archivo — así la copia en Drive nunca queda desactualizada si se edita la mantención después de completada, y nunca se duplica.

**Fotos también respaldadas en Drive** (nuevo, 2026-09-09): cada foto subida a una mantención (ver sección "Mantención: dos orígenes") se copia en segundo plano a esa misma carpeta de visita (`foto-<id>.<ext>`), descargándola desde UploadThing — que sigue siendo la fuente que sirve la galería en el sitio. A diferencia de la ficha, cada foto se sube una sola vez (nunca se sobrescribe). El ID del archivo en Drive queda en `MaintenanceImage.driveFileId`.

**Borrar una foto la borra de los tres lugares** (nuevo, 2026-09-09, probado de punta a punta): el botón "Eliminar" de una foto en `/colaborador/mantenciones/:id` borra la fila de la base, el archivo en UploadThing y su copia en Drive — las tres, en segundo plano y sin bloquearse entre sí. Antes solo se borraba de la base y las otras dos copias quedaban huérfanas para siempre.

## Alerta por kilometraje

`estimado = último_km_registrado + días_desde_esa_mantención × 40km`. Si `próximo_servicio − estimado ≤ 10.000 km`, se muestra el badge "Mantención próxima" en `/colaborador/vehiculos` y `/mi-cuenta`. Sin telemetría real del auto — es una estimación (`src/lib/maintenance-alerts.ts`).

## Agendamiento y calendario

Una cita se crea desde el sitio (calendario en `/colaborador/agenda/nueva`, solo ADMIN/COLLABORATOR) o desde WhatsApp (n8n consulta `GET /api/n8n/appointments/disponibilidad` antes de confirmar). Ambos caminos pasan por la misma función `findSchedulingConflict` (ventana de 60 minutos) antes de crear el `Appointment`, con origen `WEB` o `WHATSAPP_N8N`.

**Un CLIENT no tiene formulario propio de agendamiento en el sitio** — no existe una versión de `/colaborador/agenda/nueva` para el rol CLIENT ni un formulario público que cree un `Appointment` directamente (el formulario de `/contacto` solo genera un `ContactMessage`, no una cita). Para un cliente, el único camino para agendar, reagendar o cancelar **sus propias** citas es WhatsApp (ver más abajo). Por eso `/mi-cuenta` (layout en `src/app/mi-cuenta/layout.tsx`) muestra un botón "Agendar por WhatsApp" en la cabecera.

**Crear mantención desde una cita** (nuevo, 2026-09-09): en la ficha de una cita con vehículo asociado, botón "Crear mantención" — precarga colaborador y fecha/hora de la cita, y navega a `/colaborador/mantenciones/nueva?appointmentId=...`. Queda vinculada vía `Maintenance.appointmentId` (opcional, único) solo para trazabilidad — la mayoría de las citas no terminan en una mantención registrada (consultas, presupuestos, cliente que no llega, etc.), así que el vínculo nunca es obligatorio ni automático. Si ya existe una mantención vinculada, el botón cambia a "Ver mantención".

**Horario de atención**: el ADMIN lo define en `/admin/horario` (una fila por día de la semana: abierto/cerrado + hora de apertura y cierre). Cualquier hora fuera de ese horario se rechaza automáticamente al consultar disponibilidad o al crear/reagendar una cita — tanto desde n8n como si en el futuro se agrega un formulario público de agendamiento. Si un día nunca se configuró, se usa un default razonable (lunes a sábado 09:00-18:00, domingo cerrado) en vez de bloquear todo.

**Excepciones puntuales de horario (feriados, cierres únicos)**: además del horario semanal fijo, el ADMIN puede agregar en la misma pantalla `/admin/horario` excepciones por **fecha específica** (ej. "18 de septiembre: cerrado") sin afectar ese mismo día de la semana en el futuro — evita el problema de destildear, por ejemplo, "miércoles" en el horario semanal para cerrar solo un miércoles puntual, lo que dejaría cerrados *todos* los miércoles hasta que alguien se acuerde de reactivarlo. Una excepción puede ser cierre total o un horario especial de un solo día (ej. media jornada). `isWithinBusinessHours` revisa primero si hay una excepción para esa fecha exacta; si no hay, cae al horario semanal normal — misma función usada por los tres endpoints de n8n, así que el efecto es automático en toda la validación de disponibilidad.

**Horario en el sitio público**: la página `/contacto` muestra una sección "Horario de atención" (componente `BusinessHoursDisplay`) que consume directamente `listBusinessHours()` y `listUpcomingBusinessHoursExceptions()` — el mismo horario semanal y las mismas excepciones que ve/edita el ADMIN en `/admin/horario`, sin duplicar datos. El día actual se resalta en negrita y, si hay excepciones futuras (feriados/cierres), aparecen listadas debajo con su fecha, motivo y horario.

**Agendar, reagendar o cancelar por WhatsApp — clientes incluidos**: `POST`/`PATCH /api/n8n/appointments` permiten crear, reagendar o cancelar — ADMIN/COLLABORATOR pueden hacerlo sobre cualquier cita; un `CLIENT` solo sobre **las suyas propias** (nunca las de otra persona), revalidando siempre horario y conflicto de horario si se mueve la hora. Un `CLIENT` también puede consultar su propia agenda (`GET /api/n8n/appointments?phone=...`, agenda futura y no cancelada). Al reagendar, un `CLIENT` también puede corregir patente y nombre de contacto (nunca su propio teléfono, que es su identificador); solo puede cancelar (nunca marcar `CONFIRMADA`/`COMPLETADA` — eso es exclusivo del taller). Si la patente nueva no corresponde a ningún vehículo registrado, el vínculo existente no se toca (evita que un typo desvincule un auto ya bien enlazado).

**Autoasignación al colaborador que agenda por WhatsApp** (nuevo, 2026-09-09): si un COLLABORATOR (no ADMIN) le pide al bot que agende una cita para un cliente, esa cita queda automáticamente asignada a él mismo — aparece directo en su "Mi agenda" sin que nadie tenga que asignársela después. El ADMIN sigue quedando sin asignar por defecto (rol de recepción, no de mecánico). Requiere que `/api/n8n/usuarios` devuelva también el `id` del usuario (antes solo mandaba rol y nombre) — el `collaboratorId` va fijo en el JSON de la herramienta "Crear cita (Staff)", tomado directo de `Resolver rol`, nunca decidido por la IA.

**Tope anti-spam para autoservicio por WhatsApp** (nuevo, 2026-09-09): un mismo número de teléfono no puede tener más de **5 citas activas y futuras** a la vez creándolas él mismo por WhatsApp (`MAX_ACTIVE_APPOINTMENTS_PER_PHONE` en `route.ts`) — pensado para que nadie acapare toda la agenda disponible del taller. Este límite **no aplica** cuando es un ADMIN/COLLABORATOR quien agenda (campo `actor: "STAFF"` vs `"CLIENT"`, fijo en cada herramienta de n8n, nunca lo decide la IA) — un colaborador puede seguir creando todas las citas que un cliente necesite por teléfono, sin tope.

**Limpieza automática**: un cron diario de Vercel (`/api/cron/cleanup-appointments`, protegido con `CRON_SECRET`) cancela solas las citas que quedaron en `PENDIENTE` (nunca se confirmaron) y ya pasó su hora — libera el horario para que se pueda volver a agendar. Una `CONFIRMADA` vencida nunca se toca sola; queda para que un colaborador decida manualmente si fue `COMPLETADA`. En el calendario, una cita `CANCELADA` se ve tachada y en gris, no desaparece.

**Control de acceso en n8n**: antes de cualquier acción, n8n consulta `GET /api/n8n/usuarios?phone=...` para saber si quien escribe es `ADMIN`, `COLLABORATOR`, `CLIENT` o desconocido — reutiliza los mismos usuarios que el ADMIN ya administra en `/admin/colaboradores` (no hay una lista de teléfonos separada que mantener). Un colaborador deshabilitado (`active = false`) pierde el acceso automáticamente, tanto en la web como en WhatsApp. Solo ADMIN/COLLABORATOR pueden crear, editar o cancelar citas/mantenciones/cotizaciones por WhatsApp; un CLIENT (o número no registrado) solo puede hacer consultas.

**Consultar citas del taller por rango de fecha o estado (nuevo, 2026-09-09):** un ADMIN/COLLABORATOR puede pedirle al bot "las citas de hoy", "las de esta semana", "las pendientes" o "las canceladas" en vez de abrir el sitio (`GET /api/n8n/appointments?from=...&to=...&status=...`, todos los parámetros opcionales — sin ninguno, trae desde ahora en adelante). Tope de **15 resultados** (`N8N_APPOINTMENTS_LIST_LIMIT` en `appointment.service.ts`) para no inundar el chat de WhatsApp; si hay más, `truncated: true` le avisa al bot para que sugiera acortar el rango o pedir un estado específico.

**Permisos de edición por WhatsApp — ver todo, editar solo lo propio (nuevo, 2026-09-09):** un ADMIN puede ver y editar (reagendar/cancelar/corregir) cualquier cita. Un COLLABORATOR puede **ver todas** las citas del taller (con la consulta de arriba), pero solo puede **editar** las que están sin asignar o asignadas a él mismo — si intenta modificar una cita de otro colaborador, `PATCH /api/n8n/appointments/:id` responde 403 (`AppointmentForbiddenError`) y el bot se lo explica. Un CLIENT sigue restringido a solo sus propias citas (ver más arriba). El `role`/`collaboratorId` que hacen cumplir esto van fijos en el JSON de la herramienta "Reagendar o cancelar cita (Staff)", tomados de `Resolver rol` — nunca los decide la IA.

**Bug encontrado y corregido (2026-09-09): teléfonos con "+" nunca coincidían con WhatsApp.** Los formularios (colaboradores, registro de cliente, cliente nuevo al registrar vehículo) guardaban el teléfono tal cual se tipeaba — si alguien escribía `+56 9 1234 5678` (lo natural), quedaba así en la base. Pero WhatsApp manda el remitente **sin "+", sin espacios y sin guiones** (`56912345678`), así que la comparación exacta en `findUserRoleByPhone` nunca coincidía: un colaborador o cliente real quedaba tratado como anónimo, sin que nada avisara del problema. Se detectó al probar el flujo de staff con una cuenta de prueba real. Arreglado en dos frentes: `src/lib/phone.ts` (`normalizePhone`, deja solo dígitos) se aplica ahora al guardar en los 3 formularios, y `findUserRoleByPhone` también normaliza el teléfono entrante por si acaso. Se hizo además un backfill único (2026-09-09) limpiando los teléfonos ya guardados en `users` y `appointments.contactPhone` — si en el futuro se importan datos de otra fuente, hay que normalizarlos de la misma forma antes de insertarlos.

## Cotizaciones a proveedores

El colaborador dicta por voz qué repuesto necesita → **si la mantención no se creó en el mismo turno de conversación, n8n primero resuelve cuál mantención es** (mismo endpoint que usa para cerrarla: `GET /api/n8n/mantenciones?patente=X&collaboratorPhone=Y`, desambiguando por fecha+descripción si hay varias abiertas) → crea un `QuoteRequest` con ese `maintenanceId` (`POST /api/n8n/cotizaciones`) → consulta los proveedores activos (`GET /api/n8n/proveedores`) → les envía correo → cada respuesta se registra (`POST /api/n8n/cotizaciones/:id/respuestas`) → n8n decide la mejor oferta y la marca (`POST /api/n8n/cotizaciones/:id/seleccionar`, en una transacción que desmarca las demás). Todo queda trazado en `/admin/cotizaciones` (solo lectura, no hay forma de crear una cotización a mano desde la web).

## Contabilidad

El admin filtra por rango de fechas, colaborador y/o estado de pago (`buildWhere`, excluye siempre `CANCELADA`). Con ese mismo filtro se calculan en paralelo:
- **Resumen agregado**: `getAccountingSummary` — totales generales, desglose por colaborador (quién generó cuánto) y desglose por estado de pago (pagado/pendiente/parcial).
- **Detalle paginado**: `listMaintenancesForAccounting`, 20 registros por página, con Anterior/Siguiente preservando los filtros activos en la URL.

## Destacado de la portada

El ADMIN edita un único "destacado" desde `/admin/destacado` (título, descripción, imagen, texto y enlace del botón, y un toggle `active`). El sitio siempre muestra **el más reciente con `active = true`** (`getActiveHighlight`), justo después del hero en la landing. Si no hay ninguno activo, esa sección simplemente no aparece — no es obligatorio tener uno. Sirve para anunciar un producto o servicio nuevo en grande, sin tener que tocar código.

**Eliminar destacado** (nuevo, 2026-09-09): antes solo se podía crear/editar (o desmarcar "Activo" para ocultarlo sin borrar nada) — ahora hay un botón "Eliminar destacado" que borra el registro completo y su imagen de UploadThing.

## Servicio estrella

Cualquier `ServicePost` puede marcarse como el "servicio estrella" (checkbox `featured` en `/admin/servicios`). Solo puede haber uno a la vez: al marcar uno, `createServicePost`/`updateServicePost` desmarcan automáticamente cualquier otro en la misma transacción. El servicio estrella se muestra en un banner grande con borde e insignia propios (`FeaturedServiceBanner`) justo después del hero en la landing — antes del banner de "Destacado" — y también lleva una insignia "⭐ Estrella" en su card del catálogo (`/servicios`) y en su página de detalle. Por defecto (seed) es **Mantenciones**, el servicio que el taller quiere potenciar; el admin puede cambiarlo a cualquier otro servicio publicado cuando quiera.

## Referencias de clientes

El ADMIN administra testimonios desde `/admin/referencias` (nombre del cliente, comentario, foto opcional, orden y estado publicado/borrador) — mismo patrón CRUD que Servicios/Productos. La landing muestra los publicados (`listPublishedReferences`) en un **carrusel horizontal con scroll-snap** ("Lo que dicen nuestros clientes"), entre el catálogo de servicios y la sección de cierre — así soporta cualquier cantidad de referencias sin alargar la página indefinidamente. Tiene flechas de navegación (se deshabilitan solas al llegar al principio/final) y también se puede deslizar directo con el dedo/mouse. Si no hay ninguna referencia publicada, la sección no se renderiza.

## Limpieza de imágenes en UploadThing (nuevo, 2026-09-09)

Antes, borrar un registro con foto (o reemplazarla al editar) solo borraba la fila de la base — el archivo quedaba huérfano en UploadThing para siempre. Ahora, en **Destacado, Referencias, Productos y Servicios**:

- **Eliminar el registro** → también borra su imagen de UploadThing (`deleteUploadThingFile`, `src/lib/uploadthing-server.ts`).
- **Editar y subir una foto nueva** → la foto anterior también se borra de UploadThing (se compara la imagen previa contra la nueva antes de limpiar).

Todo corre en segundo plano, best-effort — si falla el borrado en UploadThing, no afecta la operación principal (el registro igual se borra/actualiza), solo queda un `console.error` en los logs del servidor.

**Fotos de mantención** (ver sección "Ficha PDF descargable" más abajo) siguen el mismo espíritu, pero además limpian su copia en Drive — es el caso más completo, con las tres piezas (base, UploadThing, Drive) sincronizadas al borrar.

## Mensajes de contacto

El formulario público (`/contacto`) exige **nombre, teléfono, mensaje y aceptar la política de privacidad** (el teléfono es obligatorio desde el 2026-09-08 — antes era opcional, pero sin él no había forma de contactar al cliente por WhatsApp; el checkbox de privacidad se agregó el mismo día). Cada mensaje llega a `/admin/mensajes`, con buscador (por nombre/correo/mensaje), filtro **Todos / No leídos / Leídos** (nuevo, 2026-09-09 — tabs que se combinan con la búsqueda) y paginación de 20 en 20, todo conservado en la URL. Por cada mensaje con teléfono, hay un botón **"WhatsApp"** que abre `wa.me/<teléfono>` con un primer mensaje ya redactado pidiéndole al cliente los datos que hacen falta para agendar (patente, marca/modelo, qué necesita el auto, y disponibilidad horaria) — así el colaborador no tiene que escribirlo de cero cada vez.

## Permisos por rol

| Acción | ADMIN | COLLABORATOR | CLIENT |
|---|---|---|---|
| Ver catálogo público / agendar | Sí | Sí | Sí |
| Ver su propio historial de autos | Sí | — | Sí |
| Registrar vehículo / mantención | Sí | Sí | — |
| Ver agenda de todos los colaboradores | Sí | Solo la propia | — |
| Contabilidad general | Sí | — | — |
| Gestionar catálogo / productos / proveedores / destacado / servicio estrella / referencias | Sí | — | — |
| Habilitar / deshabilitar colaborador | Sí | — | — |
