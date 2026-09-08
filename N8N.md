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

## 1. Credenciales que debes crear en n8n

| Credencial | Valor |
|---|---|
| Header `x-api-key` | El mismo valor de `N8N_API_KEY` en el `.env` del sitio (no lo dupliques a mano en varios nodos — usa una credencial/variable de entorno de n8n, así si rota la clave se actualiza en un solo lugar). |
| URL base | El dominio público del sitio desplegado (ej. `https://tccars.cl`), como variable de entorno de n8n (ej. `TCCARS_BASE_URL`). En desarrollo local, `http://localhost:3000`. |
| (Opcional) Postgres | El mismo `DATABASE_URL` del `.env`, solo para lecturas rápidas (punto 6). |

Todas las rutas bajo `/api/n8n/*` se llaman con el nodo **HTTP Request**, header `x-api-key`, body en JSON. Todas devuelven `{"ok": true, ...}` en éxito, o `{"error": "mensaje"}` con status 4xx/5xx en error — el workflow debe revisar el status code y reaccionar (pedir otro dato, avisar al colaborador/cliente), no asumir siempre éxito.

## 2. Flujo A — Agendar una cita por WhatsApp

**Trigger**: WhatsApp Trigger (mensaje entrante) → nodo de IA que interpreta si el cliente quiere agendar y extrae: nombre, teléfono (viene del mensaje), fecha/hora deseada, patente (opcional — puede no tener auto registrado aún).

1. **(Recomendado)** Antes de ofrecer una hora al cliente:
   `GET /api/n8n/appointments/disponibilidad?scheduledAt=2026-09-15T10:30:00`
   → `{"available": true}` o `{"available": false}`. Si es `false`, prueba otra hora antes de seguir.

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
   - `409` → `{"ok": false, "available": false, "error": "Esa hora ya está reservada..."}` — ofrece otra hora, no reintentes la misma.
   - `400` → datos inválidos (revisa el mensaje de error).

3. Confirma la hora al cliente por WhatsApp.

⚠️ **La validación de conflicto es global para todo el taller**, no por colaborador: una ventana de ±60 minutos alrededor de la hora pedida bloquea cualquier otra cita en ese rango, sin importar quién la vaya a atender. Si el taller tiene varios mecánicos que deberían poder atender en paralelo a la misma hora, eso requiere un cambio en el código del sitio (avisa si lo necesitas).

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

Organización sugerida en Drive (convención de tu workflow, la app no la impone): una carpeta por patente, archivo nombrado `patente-fecha.pdf`.

**Requisito pendiente**: sin la cuenta de servicio de Google configurada (`FALTANTES.md`, punto 1), este endpoint igual guarda el enlace, pero al intentar descargar esa ficha el sitio no podrá leerla de Drive — en ese caso **cae automáticamente al PDF propio como respaldo** (mismos datos, mismo formato), así que el cliente igual recibe algo descargable mientras configuras Drive.

## 4. Flujo C — Cotización a proveedores

**Trigger**: mismo audio/intención de "necesito cotizar tal repuesto".

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
   `patente` y `maintenanceId` son opcionales (pero recomendado mandar `maintenanceId` si ya existe, por la misma razón del punto 3.4). Respuesta: `{"ok": true, "quoteRequestId": "..."}`.
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
