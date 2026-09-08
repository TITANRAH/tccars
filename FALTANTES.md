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

## 2. Resend — verificar dominio propio

Estado: **⚠️ configuración correcta, pero los envíos siguen fallando — bug abierto de Resend, sin resolver.**

Lo que sí está bien: dominio `tccars.cl` comprado, DNS apuntado a Vercel, los 4 registros de Resend (DKIM, SPF ×2, DMARC) agregados en Vercel → DNS Records, y el dominio figura "Verified" en Resend (confirmado con `dig` directo también). `RESEND_FROM_EMAIL` actualizado a `TC Cars <no-reply@tccars.cl>` en `.env` y Vercel.

**El problema real**: pese a que todo lo de arriba está bien, **los correos no llegan**. La API acepta el envío (200 OK), pero el evento final en el dashboard de Resend queda "Failed" con el motivo `domain_not_verified` — una contradicción, porque el dominio sí está verificado. Confirmado en dos pruebas reales distintas el 2026-09-08 (la última, un envío de ficha por correo desde `/colaborador/mantenciones/:id`). El propio soporte de Resend reconoció que es una inconsistencia de su backend, no de nuestra configuración. Hay un ticket abierto con ellos, esperando respuesta.

**Mientras esto no se resuelva, ningún correo real de la app llega a nadie**: verificación de cuenta, recuperar contraseña, invitaciones a colaboradores/clientes, aviso de contacto, ficha por correo. No es necesario re-revisar DNS ni el dominio — ya se descartó exhaustivamente, dos veces.

**Workaround ya implementado (2026-09-08)** para que esto no bloquee operar el taller: al crear un colaborador o un cliente nuevo, el link para que esa persona cree su contraseña ahora se muestra directo en pantalla (con botón "Copiar link"), no solo se manda por correo. Se puede seguir agregando gente al sistema mandando el link a mano por WhatsApp mientras Resend no funcione.

## 3. Política de privacidad — revisión legal

Agregué una página real en `/politica-privacidad` (cubre qué datos se recopilan, para qué, con quién se comparten — Resend/UploadThing/Neon/Vercel como encargados técnicos — y derechos ARCO según la Ley 19.628), más un checkbox obligatorio de aceptación en el formulario de contacto y en el registro de cuenta.

**Importante**: yo no soy abogado y esto no reemplaza una revisión legal real. Es un texto base razonable, pero antes de darlo por 100% cumplido te recomiendo que un abogado lo revise — sobre todo porque Chile tiene la **Ley 21.719** (nueva ley de protección de datos personales) que entra en vigencia en diciembre de 2026 y trae obligaciones adicionales (DPO en ciertos casos, registro de tratamientos, etc.) que este texto no cubre en detalle.

Estado: **base construida, pendiente de revisión legal por tu parte**.
