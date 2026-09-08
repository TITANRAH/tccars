# Flujos del sistema

Versión en texto de los flujos reales de TC CARS, para tenerla versionada junto al código. La versión visual (diagramas) vive en este artefacto: https://claude.ai/code/artifact/9e484576-7fc7-46ee-88ec-20adf7311ab0

**Estado**: en producción en `https://tccars.cl` (Vercel, deploy automático en cada push a `main`), con Resend enviando correos reales desde `no-reply@tccars.cl`. Único pendiente real: la cuenta de servicio de Google para Drive (ver `FALTANTES.md`), sin bloquear nada gracias al fallback de fichas.

## Autenticación y roles

Registro → `User` creado + email de verificación (Resend) → clic en el link → `emailVerified = true` → login con Credentials → se valida `active` (lo controla solo ADMIN) → redirect según rol (`ADMIN` → `/admin`, `COLLABORATOR` → `/colaborador`, `CLIENT` → `/mi-cuenta`). Recuperar contraseña usa un token de un solo uso enviado por email. El registro exige aceptar la política de privacidad (`/politica-privacidad`) con un checkbox obligatorio (`privacyAccepted`).

## Vehículos y clientes

El colaborador busca un cliente existente o crea uno nuevo (password temporal + email de invitación) en el mismo formulario. Luego llena patente/marca/modelo/año/color. La patente es única en todo el sistema (índice único de Prisma + validación de formato en `vehicleSchema`); 1 cliente puede tener N vehículos, cada vehículo pertenece a un solo cliente.

## Mantención: dos orígenes

- **Web**: el colaborador llena el formulario en `/colaborador/mantenciones/nueva`.
- **WhatsApp + n8n**: el colaborador manda un audio, n8n lo transcribe y llama `POST /api/n8n/mantenciones` (resuelve vehículo por patente y colaborador por teléfono). La mantención queda en **`EN_PROCESO`** por defecto — no se cierra sola. Puede durar días así, mientras el colaborador la trabaja. Si n8n nunca manda un cierre explícito, se queda en `EN_PROCESO` indefinidamente (no hay cierre automático por tiempo).

**Cerrarla por voz, sabiendo cuál (si hay varias abiertas)**: el colaborador dice la patente (y n8n ya sabe su teléfono desde WhatsApp) → n8n llama `GET /api/n8n/mantenciones?patente=X&collaboratorPhone=Y`, que devuelve las mantenciones `AGENDADA`/`EN_PROCESO` de ese auto (folio, descripción, quién la tiene). Si hay una sola, n8n la cierra directo. Si hay varias, **desambigua combinando fecha y descripción, no por folio** — el colaborador nunca supo ese número, pero la fecha es lo más decidor porque siempre es distinta (la descripción sola puede repetirse, ej. dos "cambio de aceite" del mismo auto en fechas distintas): n8n le lee de vuelta ambas cosas ("tienes abierta una de hace 3 días sobre 'cambio de aceite' y otra de hoy sobre 'ruido en el motor', ¿cuál terminaste?"). El folio queda solo como referencia interna para el ADMIN en contabilidad. Con el `maintenanceId` resuelto, llama `PATCH /api/n8n/mantenciones/:id` con `status: "COMPLETADA"` y los costos finales — el merge preserva los costos ya cargados, no los resetea a 0.

Ambos caminos crean/actualizan el mismo modelo `Maintenance`, visible en el mismo historial.

**Fotos**: hasta 20 imágenes por mantención (`MAX_IMAGES_PER_MAINTENANCE`); el botón de subida desaparece al llegar al límite. Cada foto se comprime automáticamente en el navegador antes de subirse (reescalada a 1600px máx., recomprimida a JPEG ~75% de calidad) para no gastar espacio de UploadThing con fotos de celular de varios MB.

## Ficha PDF descargable

En `/api/fichas/[maintenanceId]/route.ts`:
1. Si `fichaDriveFileId` está enlazado (lo hace n8n vía `POST /api/n8n/fichas`) → intenta descargar el PDF real desde Google Drive.
2. Si no hay ficha de Drive enlazada, **o si el intento de descargarla falla por cualquier motivo** (credenciales no configuradas, Drive caído, archivo borrado o no compartido) → genera el PDF al vuelo con `renderFichaPdf`, mismo formato que las fichas reales del taller. El cliente nunca se queda sin poder descargar algo solo porque Drive falló.
3. Ese PDF propio solo se genera si `status === "COMPLETADA"` — si no, 409 "disponible cuando esté completada".

## Alerta por kilometraje

`estimado = último_km_registrado + días_desde_esa_mantención × 40km`. Si `próximo_servicio − estimado ≤ 10.000 km`, se muestra el badge "Mantención próxima" en `/colaborador/vehiculos` y `/mi-cuenta`. Sin telemetría real del auto — es una estimación (`src/lib/maintenance-alerts.ts`).

## Agendamiento y calendario

Una cita se crea desde el sitio (calendario) o desde WhatsApp (n8n consulta `GET /api/n8n/appointments/disponibilidad` antes de confirmar). Ambos caminos pasan por la misma función `findSchedulingConflict` (ventana de 60 minutos) antes de crear el `Appointment`, con origen `WEB` o `WHATSAPP_N8N`.

## Cotizaciones a proveedores

El colaborador dicta por voz qué repuesto necesita → n8n crea un `QuoteRequest` (`POST /api/n8n/cotizaciones`) → consulta los proveedores activos (`GET /api/n8n/proveedores`) → les envía correo → cada respuesta se registra (`POST /api/n8n/cotizaciones/:id/respuestas`) → n8n decide la mejor oferta y la marca (`POST /api/n8n/cotizaciones/:id/seleccionar`, en una transacción que desmarca las demás). Todo queda trazado en `/admin/cotizaciones`.

## Contabilidad

El admin filtra por rango de fechas, colaborador y/o estado de pago (`buildWhere`, excluye siempre `CANCELADA`). Con ese mismo filtro se calculan en paralelo:
- **Resumen agregado**: `getAccountingSummary` — totales generales, desglose por colaborador (quién generó cuánto) y desglose por estado de pago (pagado/pendiente/parcial).
- **Detalle paginado**: `listMaintenancesForAccounting`, 20 registros por página, con Anterior/Siguiente preservando los filtros activos en la URL.

## Destacado de la portada

El ADMIN edita un único "destacado" desde `/admin/destacado` (título, descripción, imagen, texto y enlace del botón, y un toggle `active`). El sitio siempre muestra **el más reciente con `active = true`** (`getActiveHighlight`), justo después del hero en la landing. Si no hay ninguno activo, esa sección simplemente no aparece — no es obligatorio tener uno. Sirve para anunciar un producto o servicio nuevo en grande, sin tener que tocar código.

## Servicio estrella

Cualquier `ServicePost` puede marcarse como el "servicio estrella" (checkbox `featured` en `/admin/servicios`). Solo puede haber uno a la vez: al marcar uno, `createServicePost`/`updateServicePost` desmarcan automáticamente cualquier otro en la misma transacción. El servicio estrella se muestra en un banner grande con borde e insignia propios (`FeaturedServiceBanner`) justo después del hero en la landing — antes del banner de "Destacado" — y también lleva una insignia "⭐ Estrella" en su card del catálogo (`/servicios`) y en su página de detalle. Por defecto (seed) es **Mantenciones**, el servicio que el taller quiere potenciar; el admin puede cambiarlo a cualquier otro servicio publicado cuando quiera.

## Referencias de clientes

El ADMIN administra testimonios desde `/admin/referencias` (nombre del cliente, comentario, foto opcional, orden y estado publicado/borrador) — mismo patrón CRUD que Servicios/Productos. La landing muestra los publicados (`listPublishedReferences`) en un **carrusel horizontal con scroll-snap** ("Lo que dicen nuestros clientes"), entre el catálogo de servicios y la sección de cierre — así soporta cualquier cantidad de referencias sin alargar la página indefinidamente. Tiene flechas de navegación (se deshabilitan solas al llegar al principio/final) y también se puede deslizar directo con el dedo/mouse. Si no hay ninguna referencia publicada, la sección no se renderiza.

## Mensajes de contacto

El formulario público (`/contacto`) exige **nombre, teléfono, mensaje y aceptar la política de privacidad** (el teléfono es obligatorio desde el 2026-09-08 — antes era opcional, pero sin él no había forma de contactar al cliente por WhatsApp; el checkbox de privacidad se agregó el mismo día). Cada mensaje llega a `/admin/mensajes`, con buscador (por nombre/correo/mensaje) y paginación de 20 en 20. Por cada mensaje con teléfono, hay un botón **"WhatsApp"** que abre `wa.me/<teléfono>` con un primer mensaje ya redactado pidiéndole al cliente los datos que hacen falta para agendar (patente, marca/modelo, qué necesita el auto, y disponibilidad horaria) — así el colaborador no tiene que escribirlo de cero cada vez.

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
