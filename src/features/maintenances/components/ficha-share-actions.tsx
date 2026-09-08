"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  getFichaShareLinkAction,
  sendFichaByEmailAction,
} from "@/features/maintenances/actions/maintenance.actions"

export function FichaShareActions({
  maintenanceId,
  clientPhone,
}: {
  maintenanceId: string
  clientPhone: string | null
}) {
  const [isSendingEmail, startEmail] = useTransition()
  const [isSharingWhatsapp, startWhatsapp] = useTransition()

  function handleSendEmail() {
    startEmail(async () => {
      const result = await sendFichaByEmailAction(maintenanceId)
      if (result.success) {
        toast.success("Ficha enviada por correo")
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleShareWhatsapp() {
    startWhatsapp(async () => {
      const result = await getFichaShareLinkAction(maintenanceId)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      const digits = clientPhone?.replace(/\D/g, "") ?? ""
      const message = `Hola, te comparto la ficha de tu mantención: ${result.url}`
      const waUrl = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
      window.open(waUrl, "_blank")
    })
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={isSendingEmail} onClick={handleSendEmail}>
        {isSendingEmail ? "Enviando..." : "Enviar por correo"}
      </Button>
      <Button size="sm" variant="outline" disabled={isSharingWhatsapp} onClick={handleShareWhatsapp}>
        {isSharingWhatsapp ? "Preparando..." : "Compartir por WhatsApp"}
      </Button>
    </div>
  )
}
