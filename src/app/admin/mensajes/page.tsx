import { requireRole } from "@/lib/auth-guards"
import { listContactMessages } from "@/features/contact/services/contact.service"
import { ContactMessagesList } from "@/features/contact/components/contact-messages-list"

export const metadata = { title: "Mensajes de contacto — Panel admin" }

export default async function AdminContactMessagesPage() {
  await requireRole("ADMIN")
  const messages = await listContactMessages()

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold">Mensajes de contacto</h1>
      <ContactMessagesList messages={messages} />
    </div>
  )
}
