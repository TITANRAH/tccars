import Image from "next/image"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/motion/fade-in"
import type { Highlight } from "@/generated/prisma/client"

export function HighlightBanner({ highlight }: { highlight: Highlight }) {
  return (
    <section className="px-4 py-16">
      <FadeIn className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-primary/40 bg-card">
        <div className="grid sm:grid-cols-2">
          <div className="relative h-56 w-full sm:h-auto">
            {highlight.imageUrl ? (
              <Image
                src={highlight.imageUrl}
                alt={highlight.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted text-primary/40">
                <Sparkles className="size-16" strokeWidth={1.25} />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold tracking-wide text-primary uppercase">
              <Sparkles className="size-3.5" />
              Novedad
            </span>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{highlight.title}</h2>
            <p className="text-muted-foreground">{highlight.description}</p>
            <Button asChild size="lg" className="mt-2 w-fit">
              <Link href={highlight.ctaHref}>{highlight.ctaLabel}</Link>
            </Button>
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
