import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import type { ServicePost } from "@/generated/prisma/client"
import { iconForServiceSlug } from "@/features/catalog-services/service-icons"

export function ServiceCard({ service }: { service: ServicePost }) {
  // iconForServiceSlug busca un componente ya existente por clave (no crea uno
  // nuevo), pero la regla experimental react-hooks/static-components no lo distingue.
  const Icon = iconForServiceSlug(service.slug)

  return (
    <Link
      href={`/servicios/${service.slug}`}
      className={`group relative block overflow-hidden rounded-2xl border bg-card transition-colors ${
        service.featured
          ? "border-primary shadow-[0_0_30px_-12px] shadow-primary/50"
          : "border-border hover:border-primary/50"
      }`}
    >
      {service.featured ? (
        <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-black tracking-wide text-primary-foreground uppercase">
          <Star className="size-3 fill-current" />
          Estrella
        </span>
      ) : null}
      {service.imageUrl ? (
        <div className="relative h-44 w-full overflow-hidden bg-muted">
          <Image
            src={service.imageUrl}
            alt={service.title}
            fill
            className="object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex h-44 items-center justify-center bg-muted text-primary/40">
          {/* eslint-disable-next-line react-hooks/static-components -- lookup por clave, no creación */}
          <Icon className="size-16" strokeWidth={1.25} />
        </div>
      )}
      <div className="p-5">
        <h3 className="text-lg font-bold text-foreground group-hover:text-primary">
          {service.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
      </div>
    </Link>
  )
}
