"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  generateClientResetLinkAction,
  verifyClientEmailAction,
} from "@/features/vehicles/actions/vehicle.actions"
import { fullName } from "@/lib/user-display"

export type ClientRow = {
  id: string
  firstName: string
  lastName: string
  email: string
  emailVerified: Date | null
}

export function ClientsTable({ clients }: { clients: ClientRow[] }) {
  const [isPending, startTransition] = useTransition()

  function handleResetLink(id: string) {
    startTransition(async () => {
      const result = await generateClientResetLinkAction(id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      try {
        await navigator.clipboard.writeText(result.resetUrl)
        toast.success("Link copiado", { description: result.resetUrl })
      } catch {
        toast.success("Link generado (no se pudo copiar solo)", { description: result.resetUrl })
      }
    })
  }

  function handleVerifyEmail(id: string) {
    startTransition(async () => {
      const result = await verifyClientEmailAction(id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Correo verificado — ya puede iniciar sesión")
    })
  }

  if (clients.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin resultados.</p>
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {clients.map((client) => (
        <li key={client.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{fullName(client)}</p>
              {!client.emailVerified ? (
                <Badge variant="destructive">Correo sin verificar</Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">{client.email}</p>
          </div>
          <div className="flex gap-2">
            {!client.emailVerified ? (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleVerifyEmail(client.id)}
              >
                Verificar correo
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => handleResetLink(client.id)}
            >
              Link de contraseña
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
