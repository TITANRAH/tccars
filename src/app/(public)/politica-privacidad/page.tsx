import { FadeIn } from "@/components/motion/fade-in"

export const metadata = { title: "Política de Privacidad — TC Cars" }

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <FadeIn>
        <h1 className="text-3xl font-bold text-foreground">Política de Privacidad</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última actualización: 8 de septiembre de 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-bold text-foreground">1. Quién trata tus datos</h2>
            <p className="mt-2">
              TC Cars (Av. Vicuña Mackenna 9320, La Florida, Santiago) es responsable del
              tratamiento de los datos personales que recopila a través de este sitio web,
              conforme a la Ley N° 19.628 sobre Protección de la Vida Privada.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">2. Qué datos recopilamos</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <b>Formulario de contacto:</b> nombre, teléfono, correo electrónico y el mensaje
                que escribes.
              </li>
              <li>
                <b>Creación de cuenta:</b> nombre, apellido, correo electrónico, teléfono
                (opcional) y contraseña (guardada siempre cifrada, nunca en texto plano).
              </li>
              <li>
                <b>Vehículos y mantenciones:</b> patente, marca, modelo, año, y el historial de
                mantenciones asociado a tu cuenta (registrado por nuestro equipo).
              </li>
              <li>
                <b>Agendamiento por WhatsApp:</b> nombre y teléfono de contacto, si agendas una
                hora por ese canal.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">3. Para qué los usamos</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Responder tus consultas y coordinar horas de atención.</li>
              <li>Llevar el historial de mantenciones de tu vehículo.</li>
              <li>Enviarte correos de verificación de cuenta, recuperación de contraseña, y avisos de mantenciones/citas.</li>
              <li>Contactarte por WhatsApp cuando nos escribes desde el formulario de contacto.</li>
            </ul>
            <p className="mt-2">No usamos tus datos con fines publicitarios ni los vendemos a terceros.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">4. Con quién se comparten</h2>
            <p className="mt-2">
              Usamos proveedores externos únicamente como encargados técnicos del tratamiento
              (nunca les cedemos la propiedad de tus datos):
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><b>Resend</b> — envío de nuestros correos transaccionales.</li>
              <li><b>UploadThing</b> — almacenamiento de fotos de mantenciones e imágenes del catálogo.</li>
              <li><b>Neon (PostgreSQL)</b> — alojamiento de la base de datos.</li>
              <li><b>Vercel</b> — alojamiento del sitio web.</li>
            </ul>
            <p className="mt-2">
              Si necesitamos cotizar un repuesto para tu vehículo, a los proveedores solo se les
              comparte la información técnica del repuesto (no tus datos de contacto personales).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">5. Tus derechos</h2>
            <p className="mt-2">
              Puedes solicitarnos en cualquier momento el <b>acceso, rectificación, cancelación u
              oposición</b> (derechos ARCO) sobre tus datos personales, escribiéndonos a{" "}
              <a href="mailto:tccars.cl@gmail.com" className="text-primary hover:underline">
                tccars.cl@gmail.com
              </a>{" "}
              o al WhatsApp{" "}
              <a href="https://wa.me/56966970451" className="text-primary hover:underline">
                +56 9 6697 0451
              </a>
              . Responderemos dentro de un plazo razonable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">6. Seguridad</h2>
            <p className="mt-2">
              Tu contraseña se guarda cifrada (nunca en texto plano) y las conexiones al sitio
              usan HTTPS. El acceso a los datos de clientes dentro de nuestro sistema está
              restringido según el rol de cada colaborador.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">7. Cambios a esta política</h2>
            <p className="mt-2">
              Si actualizamos esta política, la fecha de arriba va a reflejar el cambio. Te
              recomendamos revisarla ocasionalmente.
            </p>
          </section>
        </div>
      </FadeIn>
    </div>
  )
}
