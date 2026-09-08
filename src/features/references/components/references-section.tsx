import { Star } from "lucide-react"
import { FadeIn } from "@/components/motion/fade-in"
import { ReferencesCarousel } from "@/features/references/components/references-carousel"
import type { Reference } from "@/generated/prisma/client"

export function ReferencesSection({ references }: { references: Reference[] }) {
  if (references.length === 0) return null

  return (
    <section className="border-t border-border/60 bg-card/40 px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="mb-12 text-center">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold tracking-wide text-primary uppercase">
            <Star className="size-3.5 fill-current" />
            Testimonios
          </span>
          <h2 className="mt-4 text-3xl font-bold text-foreground">Lo que dicen nuestros clientes</h2>
          <p className="mt-2 text-muted-foreground">Confianza construida en más de 15 años.</p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <ReferencesCarousel references={references} />
        </FadeIn>
      </div>
    </section>
  )
}
