import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Star } from "lucide-react"
import { getPublishedServicePostBySlug } from "@/features/catalog-services/services/service-post.service"
import { iconForServiceSlug } from "@/features/catalog-services/service-icons"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/motion/fade-in"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = await getPublishedServicePostBySlug(slug)
  return { title: service ? `${service.title} — TC Cars` : "Servicio — TC Cars" }
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const service = await getPublishedServicePostBySlug(slug)
  if (!service) notFound()

  // iconForServiceSlug busca un componente ya existente por clave (no crea uno
  // nuevo), pero la regla experimental react-hooks/static-components no lo distingue.
  const Icon = iconForServiceSlug(service.slug)

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/servicios" className="text-sm text-muted-foreground hover:text-primary">
        ← Ver todos los servicios
      </Link>

      <FadeIn className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {service.imageUrl ? (
          <div className="relative h-64 w-full sm:h-80">
            <Image src={service.imageUrl} alt={service.title} fill className="object-cover" />
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center bg-muted text-primary/40 sm:h-80">
            {/* eslint-disable-next-line react-hooks/static-components -- lookup por clave, no creación */}
            <Icon className="size-24" strokeWidth={1.25} />
          </div>
        )}
        <div className="p-8">
          {service.featured ? (
            <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-black tracking-wide text-primary-foreground uppercase">
              <Star className="size-3.5 fill-current" />
              Servicio estrella
            </span>
          ) : null}
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{service.title}</h1>
          <p className="mt-4 text-muted-foreground">{service.description}</p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/contacto">Agenda este servicio</Link>
          </Button>
        </div>
      </FadeIn>
    </div>
  )
}
