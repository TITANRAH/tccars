import Link from "next/link"
import { cn } from "@/lib/utils"

/** Tabs simples de filtro (ej. "Todos / No leídos / Leídos") — conserva `q` en la URL. */
export function ListStatusFilter({
  basePath,
  paramName,
  value,
  options,
  extraParams = {},
}: {
  basePath: string
  paramName: string
  value: string
  options: { value: string; label: string }[]
  extraParams?: Record<string, string>
}) {
  function hrefFor(optionValue: string) {
    const params = new URLSearchParams(extraParams)
    if (optionValue !== options[0]?.value) {
      params.set(paramName, optionValue)
    }
    return `${basePath}?${params.toString()}`
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Link
          key={option.value}
          href={hrefFor(option.value)}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition-colors",
            value === option.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  )
}
