import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/motion/fade-in"
import { iconForServiceSlug } from "@/features/catalog-services/service-icons"
import type { ServicePost } from "@/generated/prisma/client"

/**
 * Banner grande y llamativo para el servicio "estrella" (marcado por el admin
 * en /admin/servicios). Distinto del banner de "Destacado" (novedades/productos):
 * este siempre apunta a un servicio del catálogo y usa un tratamiento visual
 * propio (borde con glow, insignia de estrella) para atraer la mirada.
 */
export function FeaturedServiceBanner({ service }: { service: ServicePost }) {
  // iconForServiceSlug busca un componente ya existente por clave (no crea uno
  // nuevo), pero la regla experimental react-hooks/static-components no lo distingue.
  const Icon = iconForServiceSlug(service.slug)

  return (
    <section className="px-4 pb-4">
      <FadeIn className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary/25 via-card to-card p-[1.5px] shadow-[0_0_60px_-15px] shadow-primary/40">
          <div className="absolute -top-24 -right-24 size-64 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative grid overflow-hidden rounded-[calc(1.5rem-1.5px)] bg-card sm:grid-cols-2">
            <div className="relative order-2 flex flex-col justify-center gap-4 p-8 sm:order-1 sm:p-10">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-black tracking-wide text-primary-foreground uppercase">
                <Star className="size-3.5 fill-current" />
                Servicio estrella
              </span>
              <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                {service.title}
              </h2>
              <p className="text-muted-foreground">{service.description}</p>
              <Button asChild size="lg" className="mt-2 w-fit">
                <Link href={`/servicios/${service.slug}`}>Ver y agendar</Link>
              </Button>
            </div>
            <div className="relative order-1 h-56 w-full sm:order-2 sm:h-auto">
              {service.imageUrl ? (
                <Image
                  src={service.imageUrl}
                  alt={service.title}
                  fill
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted text-primary/40">
                  {/* eslint-disable-next-line react-hooks/static-components -- lookup por clave, no creación */}
                  <Icon className="size-20" strokeWidth={1.25} />
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-card/80 via-transparent to-transparent sm:bg-linear-to-l" />
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
