"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  createClientAction,
  searchClientsAction,
} from "@/features/vehicles/actions/vehicle.actions"
import { fullName } from "@/lib/user-display"

type ClientOption = { id: string; firstName: string; lastName: string; email: string }

export function ClientPicker({
  value,
  onChange,
  initialLabel,
}: {
  value: string
  onChange: (clientId: string) => void
  initialLabel?: string
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ClientOption[]>([])
  const [selectedLabel, setSelectedLabel] = useState(initialLabel ?? "")
  const [showCreate, setShowCreate] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  async function copyInviteLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    toast.success("Link copiado")
  }

  useEffect(() => {
    if (value || query.trim().length < 2) {
      return
    }
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const found = await searchClientsAction(query)
        setResults(found)
      })
    }, 300)
    return () => clearTimeout(timeout)
  }, [query, value])

  if (value) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          <span>{selectedLabel || "Cliente seleccionado"}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange("")
              setSelectedLabel("")
              setInviteLink(null)
            }}
          >
            Cambiar
          </Button>
        </div>
        {inviteLink ? (
          <div className="space-y-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">
              Cliente nuevo: cópiale este link para que cree su contraseña (también se le mandó por
              correo, pero mientras Resend siga fallando, este es el respaldo que sí funciona).
            </p>
            <p className="rounded border border-border bg-card p-2 font-mono text-xs break-all">
              {inviteLink}
            </p>
            <Button type="button" size="sm" variant="outline" onClick={copyInviteLink}>
              Copiar link
            </Button>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="Buscar cliente por nombre o correo..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          if (e.target.value.trim().length < 2) setResults([])
        }}
      />
      {isPending ? <p className="text-xs text-muted-foreground">Buscando...</p> : null}
      {results.length > 0 ? (
        <ul className="rounded-lg border border-border bg-card">
          {results.map((client) => (
            <li key={client.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  onChange(client.id)
                  setSelectedLabel(`${fullName(client)} (${client.email})`)
                  setResults([])
                  setQuery("")
                }}
              >
                {fullName(client)}{" "}
                <span className="text-muted-foreground">· {client.email}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!showCreate ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(true)}>
          + Cliente nuevo
        </Button>
      ) : (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              placeholder="Nombre"
              value={newFirstName}
              onChange={(e) => setNewFirstName(e.target.value)}
            />
            <Input
              placeholder="Apellido"
              value={newLastName}
              onChange={(e) => setNewLastName(e.target.value)}
            />
          </div>
          <Input
            type="email"
            placeholder="Correo"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <Input
            placeholder="Teléfono (opcional)"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const result = await createClientAction({
                    firstName: newFirstName,
                    lastName: newLastName,
                    email: newEmail,
                    phone: newPhone,
                  })
                  if (result.success) {
                    onChange(result.data.id)
                    setSelectedLabel(`${result.data.name} (${result.data.email})`)
                    setInviteLink(result.data.resetUrl)
                    setShowCreate(false)
                    toast.success("Cliente creado")
                  } else {
                    toast.error(result.error)
                  }
                })
              }}
            >
              {isPending ? "Creando..." : "Crear y seleccionar"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
