import Link from "next/link"
import { Button } from "@/components/ui/button"

/** Anterior/Siguiente reutilizable — conserva `q` (y cualquier otro filtro) en la URL. */
export function ListPagination({
  basePath,
  page,
  totalPages,
  extraParams = {},
}: {
  basePath: string
  page: number
  totalPages: number
  extraParams?: Record<string, string>
}) {
  if (totalPages <= 1) return null

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams(extraParams)
    params.set("page", String(targetPage))
    return `${basePath}?${params.toString()}`
  }

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      {page > 1 ? (
        <Button asChild variant="outline" size="sm">
          <Link href={hrefFor(page - 1)}>Anterior</Link>
        </Button>
      ) : null}
      <span className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Button asChild variant="outline" size="sm">
          <Link href={hrefFor(page + 1)}>Siguiente</Link>
        </Button>
      ) : null}
    </div>
  )
}
