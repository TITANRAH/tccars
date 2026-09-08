import { listPublishedServicePosts } from "@/features/catalog-services/services/service-post.service"
import { ServiceCard } from "@/features/catalog-services/components/service-card"
import { FadeIn } from "@/components/motion/fade-in"

export const metadata = { title: "Servicios — TC Cars" }

export default async function ServicesPage() {
  const services = await listPublishedServicePosts()

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <FadeIn className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-foreground">Nuestros servicios</h1>
        <p className="mt-2 text-muted-foreground">
          Ajustes de motor, afinamientos, embragues, scanner y mantenciones.
        </p>
      </FadeIn>
      {services.length === 0 ? (
        <p className="text-center text-muted-foreground">Pronto publicaremos nuestros servicios.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <FadeIn key={service.id} delay={i * 0.05}>
              <ServiceCard service={service} />
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  )
}
