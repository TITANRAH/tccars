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
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2 text-sm">
        <span>{selectedLabel || "Cliente seleccionado"}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange("")
            setSelectedLabel("")
          }}
        >
          Cambiar
        </Button>
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
                    setShowCreate(false)
                    toast.success("Cliente creado. Le enviamos un correo para crear su contraseña.")
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
