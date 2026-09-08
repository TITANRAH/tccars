# Faltantes / pendientes del proyecto

Cosas que necesitan una acción tuya (fuera de código) para quedar 100% funcionales. Cuando resuelvas una, avísame y la marco como hecha.

## 1. Google Drive — descarga de fichas

Para que el botón "Descargar ficha" funcione (Fase 4), falta crear una cuenta de servicio de Google:

1. Crea un proyecto en https://console.cloud.google.com/
2. Habilita la **Google Drive API** en ese proyecto
3. Crea una **cuenta de servicio** (IAM & Admin → Service Accounts) y genera una clave JSON
4. Comparte la carpeta de Drive donde n8n va a guardar las fichas con el `client_email` de esa cuenta de servicio, como **Lector**
5. Me pasas `client_email` y `private_key` del JSON — los pego en `.env` (`GOOGLE_SERVICE_ACCOUNT_EMAIL` y `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`) y queda funcionando sin tocar código

Cuenta de Google a usar para todo esto: **tccars.cl@gmail.com**.

Estado: **pendiente**, no bloquea nada más del sistema mientras tanto — el botón "Descargar ficha" ya funciona igual (genera un PDF propio al vuelo, con el mismo formato) para cualquier mantención que no tenga ficha de Drive enlazada, **y también como respaldo si alguna sí la tiene enlazada pero Drive falla al leerla** (credenciales sin configurar, archivo no compartido, Drive caído, etc.) — el cliente nunca se queda sin poder descargar algo. Cuando conectes la cuenta de servicio, las mantenciones con ficha de n8n empiezan a descargar el PDF real de Drive automáticamente, sin tocar nada más.

## 2. Resend — verificar dominio propio

Estado: **✅ resuelto (2026-09-08)**. Dominio `tccars.cl` comprado, DNS apuntado a Vercel, los 4 registros de Resend (DKIM, SPF ×2, DMARC) agregados en Vercel → DNS Records, y verificado en Resend ("Domain verified: Your domain is ready to send emails"). `RESEND_FROM_EMAIL` actualizado a `TC Cars <no-reply@tccars.cl>` en `.env` y en las variables de entorno de Vercel (Production y Preview). Los correos reales (verificación de cuenta, recuperar contraseña, invitaciones, aviso de contacto) ya deberían llegar a cualquier destinatario, no solo al dueño de la cuenta de Resend.

## 3. Política de privacidad — revisión legal

Agregué una página real en `/politica-privacidad` (cubre qué datos se recopilan, para qué, con quién se comparten — Resend/UploadThing/Neon/Vercel como encargados técnicos — y derechos ARCO según la Ley 19.628), más un checkbox obligatorio de aceptación en el formulario de contacto y en el registro de cuenta.

**Importante**: yo no soy abogado y esto no reemplaza una revisión legal real. Es un texto base razonable, pero antes de darlo por 100% cumplido te recomiendo que un abogado lo revise — sobre todo porque Chile tiene la **Ley 21.719** (nueva ley de protección de datos personales) que entra en vigencia en diciembre de 2026 y trae obligaciones adicionales (DPO en ciertos casos, registro de tratamientos, etc.) que este texto no cubre en detalle.

Estado: **base construida, pendiente de revisión legal por tu parte**.
