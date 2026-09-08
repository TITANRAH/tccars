"use client"

import { useEffect, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { searchVehiclesAction } from "@/features/vehicles/actions/vehicle.actions"

type VehicleOption = { id: string; patente: string; marca: string; modelo: string }

export function VehiclePicker({
  value,
  onChange,
  initialLabel,
}: {
  value: string
  onChange: (vehicleId: string) => void
  initialLabel?: string
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<VehicleOption[]>([])
  const [selectedLabel, setSelectedLabel] = useState(initialLabel ?? "")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (value || query.trim().length < 2) return
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const found = await searchVehiclesAction(query)
        setResults(found)
      })
    }, 300)
    return () => clearTimeout(timeout)
  }, [query, value])

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2 text-sm">
        <span>{selectedLabel || "Vehículo seleccionado"}</span>
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
        placeholder="Buscar por patente (opcional)..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          if (e.target.value.trim().length < 2) setResults([])
        }}
        className="uppercase"
      />
      {isPending ? <p className="text-xs text-muted-foreground">Buscando...</p> : null}
      {results.length > 0 ? (
        <ul className="rounded-lg border border-border bg-card">
          {results.map((vehicle) => (
            <li key={vehicle.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  onChange(vehicle.id)
                  setSelectedLabel(`${vehicle.patente} · ${vehicle.marca} ${vehicle.modelo}`)
                  setResults([])
                  setQuery("")
                }}
              >
                {vehicle.patente}{" "}
                <span className="text-muted-foreground">
                  · {vehicle.marca} {vehicle.modelo}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
