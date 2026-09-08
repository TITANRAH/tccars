import Image from "next/image"
import type { ServicePost } from "@/generated/prisma/client"

export function ServiceCard({ service }: { service: ServicePost }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50">
      {service.imageUrl ? (
        <div className="relative h-44 w-full overflow-hidden">
          <Image
            src={service.imageUrl}
            alt={service.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex h-44 items-center justify-center bg-muted text-4xl font-black text-primary/40">
          TC
        </div>
      )}
      <div className="p-5">
        <h3 className="text-lg font-bold text-foreground">{service.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
      </div>
    </div>
  )
}
