import Image from "next/image"
import { Quote, UserRound } from "lucide-react"
import { FadeIn } from "@/components/motion/fade-in"
import type { Reference } from "@/generated/prisma/client"

export function ReferencesSection({ references }: { references: Reference[] }) {
  if (references.length === 0) return null

  return (
    <section className="border-t border-border/60 bg-card/40 px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-foreground">Lo que dicen nuestros clientes</h2>
          <p className="mt-2 text-muted-foreground">Confianza construida en más de 15 años.</p>
        </FadeIn>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {references.map((reference, i) => (
            <FadeIn
              key={reference.id}
              delay={i * 0.06}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"
            >
              <Quote className="size-6 text-primary/50" />
              <p className="grow text-sm text-muted-foreground">&ldquo;{reference.comment}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                  {reference.imageUrl ? (
                    <Image
                      src={reference.imageUrl}
                      alt={reference.authorName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <UserRound className="absolute inset-0 m-auto size-5 text-primary/40" />
                  )}
                </div>
                <p className="font-bold text-foreground">{reference.authorName}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
