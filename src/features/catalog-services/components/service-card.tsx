import Image from "next/image"
import Link from "next/link"
import type { ServicePost } from "@/generated/prisma/client"
import { iconForServiceSlug } from "@/features/catalog-services/service-icons"

export function ServiceCard({ service }: { service: ServicePost }) {
  // iconForServiceSlug busca un componente ya existente por clave (no crea uno
  // nuevo), pero la regla experimental react-hooks/static-components no lo distingue.
  const Icon = iconForServiceSlug(service.slug)

  return (
    <Link
      href={`/servicios/${service.slug}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50"
    >
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
