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

Ahora mismo el sistema envía correos (verificación de cuenta, recuperar contraseña, invitación a colaboradores/clientes nuevos, aviso de contacto) usando `onboarding@resend.dev`, que **solo puede mandar correos a tu propio email verificado en Resend**. Clientes y colaboradores reales no van a recibir esos correos hasta que se resuelva esto.

Importante: para esto se necesita un **dominio** (algo con DNS propio, ej. `tccars.cl`), no un Gmail. `tccars.cl@gmail.com` vive bajo `gmail.com`, que es de Google — nunca se puede verificar como remitente en Resend sin importar qué se compre, porque no das tú el DNS de `gmail.com`. Ese Gmail sigue sirviendo para otras cosas (recibir notificaciones, cuenta de Drive), pero no resuelve esto.

Pasos (gratis, solo requiere tener un dominio):
1. Comprar el dominio `tccars.cl` (en trámite) en un registrador (NIC Chile, GoDaddy, etc.)
2. En resend.com/domains, agregar el dominio y pegar los registros DNS (TXT/CNAME) que te da Resend, en el proveedor del dominio
3. Esperar a que se verifique (usualmente minutos)
4. Actualizar `RESEND_FROM_EMAIL` en `.env` a `TC Cars <no-reply@tccars.cl>`

Estado: **pendiente, dominio en trámite** — mientras tanto, los enlaces de verificación/recuperación/invitación quedan visibles en la consola del servidor (modo dev), y si el envío de cualquiera de estos correos falla, la cuenta/mensaje igual queda guardado (no se pierde nada, solo no llega el correo hasta que esto se resuelva).
