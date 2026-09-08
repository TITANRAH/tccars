import Image from "next/image"
import { Quote, Star, UserRound } from "lucide-react"
import { FadeIn } from "@/components/motion/fade-in"
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {references.map((reference, i) => (
            <FadeIn key={reference.id} delay={i * 0.06} className="h-full">
              <div className="group relative flex h-full flex-col gap-5 overflow-hidden rounded-2xl border border-border bg-linear-to-b from-card to-card/60 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_20px_40px_-20px] hover:shadow-primary/30">
                <Quote className="absolute -top-3 -right-2 size-24 rotate-6 text-primary/[0.06] transition-colors duration-300 group-hover:text-primary/10" />
                <div className="flex text-primary">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={starIndex} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="relative grow text-[15px] leading-relaxed text-foreground/85 italic">
                  &ldquo;{reference.comment}&rdquo;
                </p>
                <div className="relative flex items-center gap-3 border-t border-border/60 pt-5">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-primary/30 ring-offset-2 ring-offset-card">
                    {reference.imageUrl ? (
                      <Image
                        src={reference.imageUrl}
                        alt={reference.authorName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <UserRound className="absolute inset-0 m-auto size-7 text-primary/40" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{reference.authorName}</p>
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Cliente TC Cars
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
