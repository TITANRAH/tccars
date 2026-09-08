"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ReferenceCard } from "@/features/references/components/reference-card"
import type { Reference } from "@/generated/prisma/client"

export function ReferencesCarousel({ references }: { references: Reference[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  function updateScrollState() {
    const track = trackRef.current
    if (!track) return
    setCanScrollPrev(track.scrollLeft > 8)
    setCanScrollNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 8)
  }

  useEffect(() => {
    updateScrollState()
    // Si cambia la cantidad de referencias (o el ancho de ventana), el rango
    // de scroll también cambia — hay que re-evaluar los botones.
    window.addEventListener("resize", updateScrollState)
    return () => window.removeEventListener("resize", updateScrollState)
  }, [references.length])

  function scrollByCard(direction: 1 | -1) {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector<HTMLElement>("[data-reference-card]")
    const amount = card ? card.offsetWidth + 24 : track.clientWidth * 0.8
    track.scrollBy({ left: amount * direction, behavior: "smooth" })
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={updateScrollState}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {references.map((reference) => (
          <div
            key={reference.id}
            data-reference-card
            className="w-[85vw] shrink-0 snap-start sm:w-[360px]"
          >
            <ReferenceCard reference={reference} />
          </div>
        ))}
      </div>

      {references.length > 1 ? (
        <div className="mt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            disabled={!canScrollPrev}
            aria-label="Testimonio anterior"
            className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            disabled={!canScrollNext}
            aria-label="Siguiente testimonio"
            className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
