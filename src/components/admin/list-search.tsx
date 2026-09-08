"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"

/**
 * Buscador con debounce para listas administrables (colaboradores,
 * clientes, productos, servicios, proveedores, etc.). Busca sola a partir
 * de 2 letras, sin botón "Buscar" — actualiza `?q=` en la URL (y resetea
 * `page` a 1), que es lo que el server component de cada página usa para
 * filtrar. Al vaciar el campo, vuelve a mostrar la lista completa.
 */
export function ListSearch({
  basePath,
  placeholder,
}: {
  basePath: string
  placeholder: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get("q") ?? "")

  useEffect(() => {
    const trimmed = value.trim()
    if (trimmed.length > 0 && trimmed.length < 2) return

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      if (trimmed) {
        params.set("q", trimmed)
      } else {
        params.delete("q")
      }
      params.delete("page")
      router.replace(`${basePath}?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe reaccionar a cambios de "value"
  }, [value])

  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="max-w-md"
    />
  )
}
