# Instrucciones para construir el workflow de n8n

Guía técnica exacta para conectar n8n con el sitio TC CARS: qué credenciales crear, qué endpoints llamar, con qué datos, y en qué orden. Cubre los tres flujos que dependen de n8n: agendamiento por WhatsApp, mantención por voz, y cotización a proveedores.

La versión visual/conceptual de estos mismos flujos está en [FLUJOS.md](FLUJOS.md) y en el artefacto: https://claude.ai/code/artifact/9e484576-7fc7-46ee-88ec-20adf7311ab0 — este documento es el complemento técnico para construirlos en n8n.

## 0. Qué necesitas antes de empezar (fuera del sitio)

Esto no es código de la app — es infraestructura/configuración que tienes que resolver en n8n y en servicios externos:

- **n8n corriendo** (self-hosted, Docker recomendado), con salida a internet hacia la URL pública donde esté desplegado el sitio (no sirve `localhost` a menos que n8n corra en la misma máquina/red).
- **Cuenta de WhatsApp Business API** conectada a n8n (Meta Cloud API, Twilio, u otro proveedor) — 100% configuración de n8n/Meta, no algo que el sitio resuelva.
- **Nodo de transcripción de voz a texto** en n8n (ej. Whisper de OpenAI) para el flujo de mantención por voz.
- **Un modelo de lenguaje** (vía nodo de IA en n8n) para interpretar la intención del mensaje/audio y extraer los datos (patente, descripción, montos, etc.) antes de llamar a los endpoints de abajo.
- **Cuenta de servicio de Google Drive** (ver `FALTANTES.md`, punto 1) si quieres que las fichas se guarden y descarguen de Drive de verdad. Sin ella, el flujo de mantención/cierre igual funciona, pero enlazar la ficha no server para descarga real hasta que esté configurada.

## 0.5 Límite de Meta: un WhatsApp Trigger por app (y cómo se resolvió acá)

Meta/n8n solo permite **un webhook de WhatsApp activo por app de Meta** (el propio n8n lo avisa: "Due to Facebook API limitations, you can use just one WhatsApp trigger for each Facebook App"). Esto importa apenas compartas la app de Meta entre más de un bot/número — y en este proyecto se comparte: el número de TC CARS (`+56 9 3451 7178`, phone_number_id `1304004992796688`) vive bajo la misma app de Meta ("Jarbeats") y el mismo WABA (`1533795584765401`) que el bot Jarbeats del usuario.

**Solución aplicada (2026-09-09)**: el workflow de TC CARS **no tiene su propio WhatsApp Trigger**. En su lugar:
1. El workflow de Jarbeats mantiene su único `WhatsApp Trigger`.
2. Justo después, un nodo **Switch "Enrutador por número"** revisa `{{ $json.metadata.phone_number_id }}`: si es el de TC CARS, deriva el evento a un nodo **Execute Workflow** que llama al workflow de TC CARS (que arranca con un **Execute Workflow Trigger**, no un WhatsApp Trigger). Si es el número propio de Jarbeats, sigue exactamente igual que siempre — su lógica interna no se tocó.

Esto significa que el workflow de TC CARS **depende de que el workflow de Jarbeats esté activo** (es el único punto de entrada real). Si alguna vez se desactiva Jarbeats, TC CARS deja de recibir mensajes aunque su propio workflow siga activo.

**Recomendación para futuros bots**: este patrón de enrutador escala bien (agregar una fila más al Switch por cada bot nuevo), pero **para un bot nuevo de verdad independiente, lo mejor es crear una app de Meta separada** (dentro de la misma cuenta de Business Manager, no hace falta una cuenta nueva) y migrar el número a esa app. Eso le da su propio WhatsApp Trigger real, sin depender de ningún otro workflow ni tocar el enrutador compartido — más aislado y sin puntos de falla cruzados. Usar el enrutador compartido solo cuando el número ya viene agregado bajo una app existente y no vale la pena el trabajo de migrarlo.

## 1. Credenciales que debes crear en n8n

| Credencial | Valor |
|---|---|
| Header `x-api-key` | El mismo valor de `N8N_API_KEY` en el `.env` del sitio (no lo dupliques a mano en varios nodos — usa una credencial/variable de entorno de n8n, así si rota la clave se actualiza en un solo lugar). |
| URL base | El dominio público del sitio desplegado (ej. `https://tccars.cl`), como variable de entorno de n8n (ej. `TCCARS_BASE_URL`). En desarrollo local, `http://localhost:3000`. |
| (Opcional) Postgres | El mismo `DATABASE_URL` del `.env`, solo para lecturas rápidas (punto 6). |

Todas las rutas bajo `/api/n8n/*` se llaman con el nodo **HTTP Request**, header `x-api-key`, body en JSON. Todas devuelven `{"ok": true, ...}` en éxito, o `{"error": "mensaje"}` con status 4xx/5xx en error — el workflow debe revisar el status code y reaccionar (pedir otro dato, avisar al colaborador/cliente), no asumir siempre éxito.

## 1.5 Control de acceso por rol (hacer esto ANTES de cualquier otra cosa)

No cualquiera que escribe por WhatsApp puede hacer lo mismo. Al principio de **todo** flujo, antes de interpretar la intención del mensaje, resuelve quién está escribiendo:

`GET /api/n8n/usuarios?phone=+56912345678` (el teléfono tal como llega del mensaje de WhatsApp)

Respuesta:
```json
{ "found": true, "role": "ADMIN", "firstName": "...", "lastName": "..." }
```
o `{ "found": false }` si el número no está registrado.

**No hay una lista separada que mantener** — este endpoint reutiliza los mismos usuarios que el ADMIN ya administra en `/admin/colaboradores` (staff) y los que se crean al registrar un vehículo (clientes). Si deshabilitas a un colaborador (`active = false`) ahí, automáticamente deja de tener permisos acá también — sin tocar nada en n8n.

Con eso, decide la rama del workflow:

| `role` devuelto | Puede hacer |
|---|---|
| `ADMIN` o `COLLABORATOR` | Todo: crear/editar/cancelar citas **para cualquier cliente** (Flujo A — típicamente porque el cliente llamó por teléfono y el colaborador agenda en su nombre), crear y cerrar mantenciones (Flujo B), pedir cotizaciones (Flujo C). Ambos roles tienen las mismas capacidades por WhatsApp — la distinción ADMIN/COLLABORATOR solo importa en el sitio web (contabilidad, gestión de catálogo, etc.), no en estos endpoints. |
| `CLIENT` | Agenda, reagenda o cancela **su propia** cita directamente (autoservicio — ver 2.1), consulta su propia agenda (`GET /api/n8n/appointments?phone=...`, ver 2.4), y pregunta por servicios/horario del taller. **Nunca** puede crear/editar/cancelar la cita de otra persona, ni tocar mantenciones o cotizaciones (Flujos B y C siguen siendo solo para ADMIN/COLLABORATOR). |
| `found: false` (no registrado) | Mismo trato que `CLIENT` — puede agendar su propia cita como cliente nuevo (queda registrado al crear la cita) y hacer consultas generales. |

**Actualizado 2026-09-09**: se cambió la regla original (que limitaba a `CLIENT` a solo consultar) para permitir autoservicio de agendamiento — decisión del dueño del taller, priorizando que el cliente no dependa de un colaborador para sacar hora. El colaborador conserva la capacidad de agendar en nombre de cualquier cliente como canal alternativo (ej. cliente llama por teléfono).

Si el mensaje pide una acción que el rol detectado no tiene permitida, el workflow debe responder explicando que no puede hacer eso por WhatsApp — nunca llamar igual al endpoint de escritura "a ver si se cuela".

## 2. Flujo A — Agendar una cita por WhatsApp

Dos caminos posibles, según quién escribe (ver 1.5):
- **`CLIENT` o no registrado**: agenda, reagenda o cancela **su propia** cita directamente (autoservicio) — el número de WhatsApp desde el que escribe se usa como `contactPhone`, sin preguntarlo.
- **`ADMIN` o `COLLABORATOR`**: agenda, reagenda o cancela la cita **de cualquier cliente** (ej. atendiendo una llamada telefónica) — pide y confirma todos los datos de contacto antes de crear la cita.

Ambos casos usan los mismos endpoints de abajo; la única diferencia es de dónde sale el `contactPhone` y a nombre de quién se actúa.

### 2.1 Crear

**Trigger**: WhatsApp Trigger (mensaje entrante) → nodo de IA que interpreta si el cliente quiere agendar y extrae: nombre, teléfono (viene del mensaje), fecha/hora deseada, patente (opcional — puede no tener auto registrado aún).

1. **(Recomendado)** Antes de ofrecer una hora al cliente:
   `GET /api/n8n/appointments/disponibilidad?scheduledAt=2026-09-15T10:30:00`
   → `{"available": true}` o `{"available": false, "reason": "fuera_de_horario" | "hora_ocupada"}`. Si es `false`, prueba otra hora antes de seguir — usa `reason` para explicarle al cliente por qué ("esa hora está fuera de nuestro horario de atención" vs "esa hora ya está reservada").

2. Crear la cita:
   `POST /api/n8n/appointments`
   ```json
   {
     "patente": "AB1234",
     "contactName": "Juan Pérez",
     "contactPhone": "+56912345678",
     "scheduledAt": "2026-09-15T10:30:00",
     "notes": "Ruido en el motor al frenar"
   }
   ```
   `patente` y `notes` son opcionales. Respuestas:
   - `200` → `{"ok": true, "appointmentId": "..."}`
   - `409` → `{"ok": false, "available": false, "error": "Esa hora ya está reservada..." | "Esa hora está fuera del horario de atención."}` — ofrece otra hora, no reintentes la misma.
   - `400` → datos inválidos (revisa el mensaje de error).

3. Confirma la hora al cliente por WhatsApp.

⚠️ **La validación de conflicto es global para todo el taller**, no por colaborador: una ventana de ±60 minutos alrededor de la hora pedida bloquea cualquier otra cita en ese rango, sin importar quién la vaya a atender. Si el taller tiene varios mecánicos que deberían poder atender en paralelo a la misma hora, eso requiere un cambio en el código del sitio (avisa si lo necesitas).

**Horario de atención**: el ADMIN lo edita en `/admin/horario` (días y horas por día de la semana, más excepciones puntuales por fecha específica — feriados o cierres de un solo día, que no alteran ese día de la semana en el futuro). Tanto la consulta de disponibilidad como la creación/reagendamiento rechazan automáticamente cualquier hora fuera de ese horario — no hace falta que n8n lo valide por su cuenta, pero sí conviene que lo tenga en cuenta antes de ofrecerle una hora al cliente, para no proponer algo que el sitio va a rechazar después. La validación (`isWithinBusinessHours`) mira primero si hay una excepción para la fecha exacta, y si no, cae al horario semanal — así que un feriado bloquea disponibilidad igual que un día cerrado, sin que n8n tenga que distinguir entre ambos casos.

### 2.2 Reagendar o cancelar

`PATCH /api/n8n/appointments/:id` (el `appointmentId` que devolvió el `POST` al crearla)
```json
{ "scheduledAt": "2026-09-16T11:00:00" }
```
o para cancelar:
```json
{ "status": "CANCELADA" }
```
Ambos son opcionales e independientes — manda solo lo que cambia. Si mandas `scheduledAt`, se revalida horario de atención y conflicto igual que al crear (mismos códigos `409`). Respuesta: `200` → `{"ok": true, "appointmentId": "..."}`, `404` si el id no existe.

### 2.3 Limpieza automática de citas no confirmadas

No es algo que n8n tenga que hacer — el sitio ya corre un cron diario (`/api/cron/cleanup-appointments`, Vercel Cron) que cancela solas las citas que quedaron en `PENDIENTE` (nunca fueron `CONFIRMADA`) y ya pasó su hora. Una `CONFIRMADA` vencida **no** se toca sola — alguien la confirmó, así que un colaborador debe decidir manualmente si fue `COMPLETADA` o no. Lo menciono acá solo para que sepas que una cita vieja sin confirmar puede desaparecer del calendario activo (queda cancelada, no borrada) sin que nadie la haya tocado a mano.

### 2.4 Cliente consulta su propia agenda

Solo lectura — para un `CLIENT` (o número no registrado preguntando "¿tengo hora agendada?"):

`GET /api/n8n/appointments?phone=+56912345678`
```json
{ "appointments": [ { "id": "...", "scheduledAt": "...", "status": "CONFIRMADA", "vehicle": "Toyota Yaris AB1234", "notes": "..." } ] }
```
Solo trae citas futuras y no canceladas. Este endpoint no requiere ni verifica rol por sí mismo (es de solo lectura por teléfono), pero el workflow igual debe haber consultado 1.5 antes — un `CLIENT` no debe poder llegar a esta rama con intención de *modificar* nada, solo de consultar.

## 3. Flujo B — Mantención por voz (crear, editar y cerrar)

### 3.1 Crear (el colaborador dice qué necesita el auto)

**Trigger**: WhatsApp Trigger (audio) → transcripción → nodo de IA que extrae: patente, descripción, tipo (`MANTENCION` o `VISITA_TECNICA`, opcional), kilometraje (opcional). El teléfono del colaborador viene del mensaje de WhatsApp.

`POST /api/n8n/mantenciones`
```json
{
  "patente": "AB1234",
  "description": "Cambio de aceite y filtro, ruido en el motor",
  "collaboratorPhone": "+56911112222",
  "mileage": 45000
}
```
Respuesta `200`: `{"ok": true, "maintenanceId": "cml...", "folio": 7}`

- La mantención queda en **`EN_PROCESO`** automáticamente — no hace falta mandar `status`.
- **Los costos son opcionales.** Puedes crearla sin `laborCost`/`partsCost`/`additionalCost` (quedan en 0) y completarlos después con el `PATCH` del punto 3.3 — es el caso normal: no sabes el costo final hasta que se termina el trabajo.
- **Guarda el `maintenanceId`** en el estado del workflow de n8n (una tabla propia de n8n indexada por teléfono+patente, o la memoria de la conversación). Lo necesitas para los pasos siguientes.

### 3.2 Resolver cuál mantención, si hay varias abiertas

Antes de editar o cerrar una mantención por voz — ya sea para agregar precios o para marcarla completada — primero hay que saber **cuál** es, porque el mismo auto puede tener más de una abierta a la vez.

`GET /api/n8n/mantenciones?patente=AB1234&collaboratorPhone=+56911112222`

Respuesta: `{"ok": true, "maintenances": [{"maintenanceId": "...", "folio": 7, "description": "...", "status": "EN_PROCESO", "createdAt": "...", "collaboratorName": "..."}, ...]}` — solo las que están `AGENDADA` o `EN_PROCESO`.

- **0 resultados** → avisa que no hay ninguna mantención abierta para esa patente.
- **1 resultado** → usa ese `maintenanceId` directo, sin preguntar nada.
- **Más de 1** → **desambigua combinando fecha y `description`, nunca por folio.** El colaborador nunca supo el número de folio (es un dato interno, solo lo ve el ADMIN en contabilidad). La fecha (`createdAt`) es el dato más decidor porque siempre es distinta entre dos mantenciones — la descripción sola puede repetirse (dos "cambio de aceite" del mismo auto en fechas distintas). Léele de vuelta ambas cosas juntas: *"tienes abierta una de hace 3 días sobre 'cambio de aceite' y otra de hoy sobre 'ruido en el motor', ¿cuál terminaste?"* — si las fechas están muy cerca, apóyate más en la descripción; si las descripciones son iguales, apóyate en la fecha.

### 3.3 Editar costos y/o cerrar

Con el `maintenanceId` resuelto:

`PATCH /api/n8n/mantenciones/{maintenanceId}`
```json
{
  "status": "COMPLETADA",
  "laborCost": 25000,
  "partsCost": 18000,
  "nextServiceMileage": 55000
}
```

- Manda **solo los campos que el colaborador dictó en ese momento** — los que no mandes no se pisan (si el kilometraje ya se había registrado al crear, no hace falta repetirlo; si solo agregas `partsCost`, el `laborCost` ya cargado se conserva).
- **Para solo agregar/editar precios sin cerrar** (el trabajo sigue en curso): omite el campo `status` — la mantención sigue en `EN_PROCESO`.
- **Para cerrarla**: incluye `"status": "COMPLETADA"` junto con los costos finales. Es la misma llamada, la única diferencia es si mandas o no `status`.

### 3.4 Ficha (después de cerrar)

Cuando generes el PDF de la ficha (con los datos ya completos) y lo subas a Google Drive:

`POST /api/n8n/fichas`
```json
{
  "maintenanceId": "cml...",
  "driveFileId": "1AbCdEfGh...",
  "driveUrl": "https://drive.google.com/file/d/..."
}
```

⚠️ **Usa siempre `maintenanceId`, nunca solo `patente`.** Si mandas `patente` en vez de `maintenanceId`, el sitio la asocia a la mantención **más reciente** de esa patente — que puede no ser la que acabas de cerrar si hubo actividad concurrente en el mismo auto. El `maintenanceId` que ya tenías guardado desde el paso 3.1/3.2 elimina esa ambigüedad.

**Organización de carpetas en Drive** (convención fija de este proyecto — la app no la impone técnicamente, pero es la que hay que seguir):

```
Fichas TC Cars/              ← carpeta raíz, compartida como Lector con la cuenta de servicio
  └── <PATENTE>/             ← una carpeta por vehículo, nombrada con la patente (sin guiones, igual que en la base)
        ├── fichas/          ← PDFs de mantención/visita técnica/etc.
        └── fotos/           ← fotos que capture n8n por WhatsApp (a futuro, aún sin endpoint — ver más abajo)
```

Por patente y no por cliente: la patente ya es el identificador único de negocio (1 patente = 1 vehículo = 1 cliente dueño), así que agregar una capa "clientes" arriba sería redundante — quién es el dueño se resuelve en la base de datos, no en la carpeta.

**Nomenclatura de archivo dentro de `fichas/`** (convención fija, confirmada 2026-09-08):

```
AAAA-MM-DD-TCcars-<tipo>-<MARCA>-<MODELO>-<PATENTE>-<NOMBRE CLIENTE>.pdf
```

Ejemplo real: `2026-08-03-TCcars-mantencion-CHERY-TIGGO3PRO-SJFR33-SERGIO MIRANDA.pdf`

- **Fecha en AAAA-MM-DD** (no DD-MM-AAAA): así los archivos quedan ordenados cronológicamente solos en el listado de Drive — el orden alfabético coincide con el orden por fecha.
- `<tipo>` es intercambiable según corresponda: `mantencion`, `visita_tecnica`, u otro tipo que se agregue a futuro.
- **Patente sin guiones internos** (`SJFR33`, no `SJ-FR-33`) — debe coincidir exactamente con el nombre de la carpeta del vehículo y con cómo la guarda la base de datos.

Cualquier subcarpeta que crees dentro de "Fichas TC Cars" hereda automáticamente el permiso de Lector de la cuenta de servicio — no hace falta volver a compartir cada carpeta de patente por separado.

**Requisito pendiente**: sin la cuenta de servicio de Google configurada (`FALTANTES.md`, punto 1), este endpoint igual guarda el enlace, pero al intentar descargar esa ficha el sitio no podrá leerla de Drive — en ese caso **cae automáticamente al PDF propio como respaldo** (mismos datos, mismo formato), así que el cliente igual recibe algo descargable mientras configuras Drive.

**Sobre las fotos**: la carpeta `fotos/` es solo para que n8n las respalde ahí si quiere — hoy la app **no lee fotos desde Drive**. Las fotos que se ven en `/colaborador/mantenciones/:id` vienen de un flujo aparte (subida directa desde el navegador vía UploadThing, con compresión automática y tope de 20 por mantención). Si más adelante quieres que las fotos capturadas por WhatsApp aparezcan también en esa galería, hace falta un endpoint nuevo (ej. `POST /api/n8n/mantenciones/:id/fotos`) que empuje cada foto a UploadThing igual que se hace hoy con la ficha — no está construido todavía.

## 4. Flujo C — Cotización a proveedores

**Trigger**: mismo audio/intención de "necesito cotizar tal repuesto".

0. **Resuelve el `maintenanceId` antes de crear la solicitud** — a menos que ya lo tengas en memoria porque el colaborador acaba de crear/abrir esa mantención en el mismo turno de conversación. Si es un mensaje de voz separado (sesión nueva, o simplemente pasó tiempo), no asumas cuál mantención es: usa el mismo endpoint de resolución del Flujo B (3.2) — `GET /api/n8n/mantenciones?patente=AB1234&collaboratorPhone=+56911112222` — que te devuelve las mantenciones abiertas de esa patente y te deja desambiguar por fecha + descripción si hay más de una, exactamente igual que para cerrar una mantención. No es un endpoint exclusivo de "cerrar" — sirve para saber "cuál mantención" en cualquier flujo que lo necesite, cotizaciones incluido.
1. `GET /api/n8n/proveedores` → `{"suppliers": [{"id", "name", "email", "specialty", "phone"}, ...]}` (solo activos).
2. Crear la solicitud:
   `POST /api/n8n/cotizaciones`
   ```json
   {
     "patente": "AB1234",
     "maintenanceId": "cml...",
     "requestedItems": "Pastillas de freno delanteras, disco de freno"
   }
   ```
   `patente` y `maintenanceId` son opcionales, pero **manda `maintenanceId` siempre que puedas resolverlo** (paso 0) — sin él, la cotización queda "suelta" en el historial, sin poder ver después a qué mantención pertenecía. Respuesta: `{"ok": true, "quoteRequestId": "..."}`.
3. Tu workflow de n8n envía el correo a los proveedores relevantes (nodo Send Email) — esto no lo hace la app.
4. Por cada respuesta de proveedor que llegue (ej. leyendo un correo con un nodo IMAP/Email Trigger):
   `POST /api/n8n/cotizaciones/{quoteRequestId}/respuestas`
   ```json
   { "supplierEmail": "proveedor@ejemplo.cl", "amount": 45000, "notes": "Entrega en 2 días" }
   ```
   (`supplierId` también sirve si ya lo tienes, en vez de `supplierEmail`.)
5. Cuando tengas las respuestas que esperabas, tu workflow decide cuál es la mejor oferta (la lógica de comparación vive en n8n, no en el sitio) y la marca:
   `POST /api/n8n/cotizaciones/{quoteRequestId}/seleccionar`
   ```json
   { "quoteResponseId": "..." }
   ```
6. n8n le envía la cotización elegida al cliente — paso final fuera del sitio.

## 5. Lecturas rápidas directas a Postgres (opcional)

Para consultas simples que no necesitan pasar por la app (ej. "¿existe esta patente?"), puedes usar el nodo Postgres de n8n con el mismo `DATABASE_URL`, **en modo solo lectura**. Nunca hagas `INSERT`/`UPDATE`/`DELETE` directo desde n8n — siempre usa los endpoints de arriba para escrituras, así se respetan las validaciones y reglas de negocio (unicidad de patente, merge de costos, etc.).

Nombres reales de tabla en Postgres (no los nombres de los modelos de Prisma):

| Modelo | Tabla |
|---|---|
| User | `users` |
| Vehicle | `vehicles` |
| Maintenance | `maintenances` |
| Appointment | `appointments` |
| Supplier | `suppliers` |
| QuoteRequest | `quote_requests` |
| QuoteResponse | `quote_responses` |

Ejemplo, buscar un vehículo por patente junto a su dueño:
```sql
SELECT v.*, u."firstName", u."lastName", u.phone
FROM vehicles v
JOIN users u ON u.id = v."clientId"
WHERE v.patente = 'AB1234';
```

## 6. Formato de datos que espera la app

- **Patente**: se normaliza a mayúsculas sin espacios/puntos/guiones (`"sj.fr-33"` → `"SJFR33"`), 4 a 8 caracteres alfanuméricos. Los endpoints de la app la normalizan automáticamente al recibirla, pero si usas el nodo Postgres directo (punto 5), la consulta SQL **no** normaliza — limpia la patente en n8n antes de armar el `WHERE` para evitar falsos "no encontrado".
- **Teléfonos**: no hay un formato único forzado, pero para que `collaboratorPhone` encuentre al colaborador correcto, debe ser **exactamente igual** (mismo formato, con o sin `+56`) al que quedó guardado en su perfil (`/admin/colaboradores`). El campo no es único en la base — si dos colaboradores quedaran con el mismo teléfono guardado por error, el match tomaría el primero que encuentre; en la práctica, cada colaborador debería tener su propio teléfono.
- **Fechas**: ISO 8601 (`"2026-09-15T10:30:00"`).
- **Montos**: números planos, sin puntos de miles ni símbolo `$` (`25000`, no `"25.000"`).

## 7. Orden recomendado para construir esto

1. Levanta n8n y confirma que puede alcanzar la URL del sitio (`curl` simple con la `x-api-key` a cualquier endpoint `GET`, ej. `GET /api/n8n/proveedores`).
2. Crea las credenciales del punto 1.
3. Empieza por el **Flujo A** (agendamiento) — es el más simple, no depende de transcripción de voz ni IA, y sirve para validar que la conexión HTTP + API key funciona.
4. Sigue con el **Flujo B** (mantención por voz) una vez que tengas el nodo de transcripción y el de IA funcionando — es el más complejo por la desambiguación del punto 3.2.
5. Cierra con el **Flujo C** (cotizaciones).
