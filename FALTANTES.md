# Faltantes / pendientes del proyecto

Cosas que necesitan una acción tuya (fuera de código) para quedar 100% funcionales. Cuando resuelvas una, avísame y la marco como hecha.

## 1. Google Drive — descarga de fichas

Estado: **✅ resuelto y verificado (2026-09-08)**.

- Proyecto de Google Cloud: `tccars-drive` (cuenta `tccars.cl@gmail.com`).
- Google Drive API habilitada.
- Cuenta de servicio: `tccars-fichas@tccars-drive.iam.gserviceaccount.com`, clave JSON generada y cargada en `.env` local y en Vercel (Production + Preview) como `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`.
- Carpeta raíz en Drive: **"Fichas TC Cars"** (id `14Ioj2f-KjniX6SWjWbFHakLCGlITJm7T`), compartida con la cuenta de servicio como **Lector**. Estructura real ya creada: `SJFR33/fichas/` y `SJFR33/fotos/` (primer vehículo real). Convención de organización y nomenclatura de archivo documentada en `N8N.md` sección 3.4.
- **Verificado con un script de prueba**: la cuenta de servicio autentica correctamente (JWT) y puede leer metadata/contenido de Drive con el scope `drive.readonly` — confirma que `downloadDriveFile()` va a funcionar apenas n8n enlace un archivo real.
- **Hallazgo importante para cuando armes n8n**: las cuentas de servicio **no tienen cuota de almacenamiento propia** en Drive personal (`My Drive`) — no pueden subir/crear archivos ahí, solo leer los que ya existen y están compartidos con ellas. Por eso el nodo de Google Drive de n8n debe conectarse con **OAuth como `tccars.cl@gmail.com`** (la cuenta dueña), nunca con esta clave de cuenta de servicio — esta última es solo para que la app lea, no para que n8n escriba.

No bloqueaba nada mientras estuvo pendiente, y sigue sin bloquear nada mientras no exista el workflow real de n8n: el botón "Descargar ficha" sigue generando el PDF propio al vuelo para cualquier mantención sin ficha de Drive enlazada. En cuanto n8n suba el primer archivo real y lo enlace vía `POST /api/n8n/fichas`, esa mantención empieza a descargar el PDF real de Drive automáticamente.

## 1b. Respaldo automático del sitio a Drive (ficha generada por la web)

Estado: **✅ resuelto y verificado con una prueba real (2026-09-09)**.

Distinto del punto 1 (que es sobre *leer* la ficha que sube n8n en el flujo de voz): esto es que el propio sitio **suba** en segundo plano una copia espejo cada vez que alguien genera la ficha de una mantención cerrada desde la web — sin que dependa de n8n ni de que exista ese flujo.

- El PDF servido al usuario **siempre se regenera fresco** (nunca cambia esa lógica); en paralelo, sin bloquear la descarga, se sube/actualiza una copia en Drive.
- Requiere permiso de **escritura** real en Drive, que una cuenta de servicio no tiene (ver hallazgo del punto 1) — por eso usa credenciales **OAuth** (`GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`) autorizadas como `tccars.cl@gmail.com` vía Google OAuth Playground, guardadas en `.env` local.
- Implementado en `src/lib/google-drive-backup.ts`, enganchado en `ficha.service.ts`. Guarda el ID del archivo en `fichaDriveBackupFileId` (campo nuevo, **distinto** de `fichaDriveFileId` que usa el flujo de voz) para sobrescribir siempre el mismo archivo en vez de crear uno nuevo cada vez que se genera la ficha — así la copia en Drive nunca queda desactualizada si se edita la mantención después de completada.
- **Probado en vivo**: al descargar la ficha de una mantención de prueba se creó `Fichas TC Cars/QATEST1/2026-09-09-MANTENCION/ficha.pdf`; al descargarla de nuevo no se duplicó; al editar la descripción de la mantención y volver a descargarla, el mismo archivo se sobrescribió con el contenido actualizado (mismo ID, tamaño distinto).
- **Fotos de mantención también respaldadas** (2026-09-09): cada foto subida a una mantención se copia a la misma carpeta de visita (`foto-<id>.<ext>`), y su ID de Drive queda en `MaintenanceImage.driveFileId`. Al borrar la foto desde el sitio, se borra también de Drive **y** de UploadThing (`src/lib/uploadthing-server.ts`). Probado en vivo de punta a punta (subida → aparece en Drive y UploadThing → borrado → desaparece de ambos).
- Las 3 variables (`GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`) ya están cargadas en Vercel (Production) y desplegadas — el respaldo corre también en el sitio real, no solo en local.
- **App de Google Cloud pasada a "En producción"** (2026-09-09, ver punto 1c) — el refresh token guardado es uno nuevo, generado después de publicar la app, para que no expire solo a los 7 días como pasaba en modo "Prueba".

## 1c. App de Google Cloud (`tccars-drive`) — estado de publicación

Estado: **✅ resuelto (2026-09-09)**.

- **Problema que resolvió esto**: mientras el consentimiento OAuth de la app estuviera en estado "Prueba" (Testing), cualquier refresh token que emitiera Google **expiraba a los 7 días** — el respaldo a Drive se habría roto solo, en silencio, una semana después de configurarlo.
- **Solución**: se publicó la app (Google Auth Platform → Público → "Publicar app"), pasando su estado a **"En producción"** — sin pasar por la verificación completa de Google (no hace falta: la app la autoriza solo el dueño del taller con su propia cuenta, nunca usuarios externos). Antes de poder publicar hubo que completar en "Información de la marca": página principal (`https://tccars.cl`), política de privacidad (`https://tccars.cl/politica-privacidad`) y el dominio autorizado `tccars.cl`. El logo de la app se dejó **sin subir a propósito** — subir un logo obliga a enviar la app a verificación salvo que se quede en "Prueba", justo lo que se quería evitar.
- Como el token viejo se había emitido estando la app en "Prueba" (la fecha de expiración de 7 días queda fija al momento de emitirlo, no se extiende sola al publicar después), se rehizo el flujo del OAuth Playground **después** de publicar la app para conseguir un refresh token nuevo, ya sin ese límite. Es el que está cargado hoy en `.env` y Vercel.
- Al autorizar aparece la pantalla "Google no verificó esta app" — es esperable y no bloquea nada (Configuración avanzada → "Ir a TC Cars (no seguro)" → Continuar). Solo se ve en el momento de autorizar, nunca durante el uso normal del refresh token ya guardado.

## 2. Resend — verificar dominio propio

Estado: **⚠️ configuración correcta, pero los envíos siguen fallando — bug abierto de Resend, sin resolver.**

Lo que sí está bien: dominio `tccars.cl` comprado, DNS apuntado a Vercel, los 4 registros de Resend (DKIM, SPF ×2, DMARC) agregados en Vercel → DNS Records, y el dominio figura "Verified" en Resend (confirmado con `dig` directo también). `RESEND_FROM_EMAIL` actualizado a `TC Cars <no-reply@tccars.cl>` en `.env` y Vercel.

**El problema real**: pese a que todo lo de arriba está bien, **los correos no llegan**. La API acepta el envío (200 OK), pero el evento final en el dashboard de Resend queda "Failed" con el motivo `domain_not_verified` — una contradicción, porque el dominio sí está verificado. Confirmado en dos pruebas reales distintas el 2026-09-08 (la última, un envío de ficha por correo desde `/colaborador/mantenciones/:id`). El propio soporte de Resend reconoció que es una inconsistencia de su backend, no de nuestra configuración. Hay un ticket abierto con ellos, esperando respuesta.

**Mientras esto no se resuelva, ningún correo real de la app llega a nadie**: verificación de cuenta, recuperar contraseña, invitaciones a colaboradores/clientes, aviso de contacto, ficha por correo. No es necesario re-revisar DNS ni el dominio — ya se descartó exhaustivamente, dos veces.

**Workaround ya implementado (2026-09-08)** para que esto no bloquee operar el taller: al crear un colaborador o un cliente nuevo, el link para que esa persona cree su contraseña ahora se muestra directo en pantalla (con botón "Copiar link"), no solo se manda por correo. Se puede seguir agregando gente al sistema mandando el link a mano por WhatsApp mientras Resend no funcione.

**Segundo workaround (2026-09-08)**: el caso anterior no cubría a alguien que se registra solo por `/registro` (no por el taller) — esa cuenta queda creada pero bloqueada para siempre si el correo de verificación no llega, porque el login rechaza a cualquiera sin `emailVerified` y no había forma de destrabarlo desde el panel. Ahora en `/admin/clientes`, cualquier cliente sin verificar muestra un badge "Correo sin verificar" y un botón **"Verificar correo"** que lo marca como verificado directamente (sin token ni depender de Resend) — así puede iniciar sesión de inmediato.

## 3. Política de privacidad — revisión legal

Agregué una página real en `/politica-privacidad` (cubre qué datos se recopilan, para qué, con quién se comparten — Resend/UploadThing/Neon/Vercel como encargados técnicos — y derechos ARCO según la Ley 19.628), más un checkbox obligatorio de aceptación en el formulario de contacto y en el registro de cuenta.

**Importante**: yo no soy abogado y esto no reemplaza una revisión legal real. Es un texto base razonable, pero antes de darlo por 100% cumplido te recomiendo que un abogado lo revise — sobre todo porque Chile tiene la **Ley 21.719** (nueva ley de protección de datos personales) que entra en vigencia en diciembre de 2026 y trae obligaciones adicionales (DPO en ciertos casos, registro de tratamientos, etc.) que este texto no cubre en detalle.

Estado: **base construida, pendiente de revisión legal por tu parte**.
