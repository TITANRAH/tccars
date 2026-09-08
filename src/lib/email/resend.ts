import { Resend } from "resend"
import type { ReactElement } from "react"

export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL ?? "TC Cars <no-reply@tccars.cl>"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

/**
 * En desarrollo, si aún no configuraste RESEND_API_KEY, el correo se
 * imprime en la consola del servidor en vez de fallar — así se puede
 * seguir probando registro / recuperación de contraseña sin cuenta de Resend.
 */
export async function sendEmail(params: {
  to: string
  subject: string
  react: ReactElement
  attachments?: { filename: string; content: Buffer }[]
}) {
  if (!resend) {
    console.warn(
      `[email:dev] RESEND_API_KEY no configurado. Correo "${params.subject}" para ${params.to} no fue enviado (solo se registra aquí).`
    )
    return
  }

  await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: params.subject,
    react: params.react,
    attachments: params.attachments,
  })
}
