import Image from "next/image"
import { Quote, Star, UserRound } from "lucide-react"
import type { Reference } from "@/generated/prisma/client"

export function ReferenceCard({ reference }: { reference: Reference }) {
  return (
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
            <Image src={reference.imageUrl} alt={reference.authorName} fill className="object-cover" />
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
  )
}
