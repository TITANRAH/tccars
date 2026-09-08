"use server"

import { contactSchema, type ContactInput } from "@/features/contact/schemas/contact.schema"
import { saveContactMessage } from "@/features/contact/services/contact.service"
import { sendEmail } from "@/lib/email/resend"
import { ContactNotificationEmail } from "@/lib/email/templates/contact-notification-email"

type ActionResult = { success: true } | { success: false; error: string }

export async function submitContactAction(input: ContactInput): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  await saveContactMessage(parsed.data)

  const notifyTo = process.env.CONTACT_NOTIFICATIONS_EMAIL
  if (notifyTo) {
    // El mensaje ya quedó guardado (visible en /admin) aunque el correo de
    // aviso falle (ej. límite del sandbox de Resend) — no hay que hacer
    // fallar toda la acción por eso, o el visitante creería que no se envió.
    try {
      await sendEmail({
        to: notifyTo,
        subject: `Nuevo mensaje de contacto — ${parsed.data.name}`,
        react: ContactNotificationEmail(parsed.data),
      })
    } catch (error) {
      console.error("[contacto] No se pudo enviar el correo de aviso:", error)
    }
  }

  return { success: true }
}
