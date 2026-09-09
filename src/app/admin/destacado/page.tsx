import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { getLatestHighlight } from "@/features/highlight/services/highlight.service"
import { HighlightForm } from "@/features/highlight/components/highlight-form"
import { DeleteHighlightButton } from "@/features/highlight/components/delete-highlight-button"

export const metadata = { title: "Destacado — Panel" }

export default async function AdminHighlightPage() {
  await requireRole("ADMIN")
  const highlight = await getLatestHighlight()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver al panel
      </Link>
      <h1 className="mt-2 mb-2 text-2xl font-bold">Destacado de la portada</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Se muestra en grande en la página de inicio, justo después del encabezado. Desmarca
        &quot;Activo&quot; para quitarlo del sitio sin perder los datos.
      </p>
      <HighlightForm
        highlight={
          highlight
            ? {
                id: highlight.id,
                title: highlight.title,
                description: highlight.description,
                imageUrl: highlight.imageUrl ?? "",
                ctaLabel: highlight.ctaLabel,
                ctaHref: highlight.ctaHref,
                active: highlight.active,
              }
            : undefined
        }
      />
      {highlight ? (
        <div className="mt-6">
          <DeleteHighlightButton highlightId={highlight.id} />
        </div>
      ) : null}
    </div>
  )
}
