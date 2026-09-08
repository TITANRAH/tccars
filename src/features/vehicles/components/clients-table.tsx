"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { generateClientResetLinkAction } from "@/features/vehicles/actions/vehicle.actions"
import { fullName } from "@/lib/user-display"

export type ClientRow = { id: string; firstName: string; lastName: string; email: string }

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

  if (clients.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin resultados.</p>
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {clients.map((client) => (
        <li key={client.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">{fullName(client)}</p>
            <p className="text-xs text-muted-foreground">{client.email}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => handleResetLink(client.id)}
          >
            Link de contraseña
          </Button>
        </li>
      ))}
    </ul>
  )
}
