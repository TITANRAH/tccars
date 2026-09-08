import Image from "next/image"
import Link from "next/link"
import { ShieldCheck, Sparkles, Handshake, Users, Cpu, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/motion/fade-in"
import { listPublishedServicePosts } from "@/features/catalog-services/services/service-post.service"
import { ServiceIconStrip } from "@/features/catalog-services/components/service-icon-strip"
import { getActiveHighlight } from "@/features/highlight/services/highlight.service"
import { HighlightBanner } from "@/features/highlight/components/highlight-banner"

const WHY_US = [
  {
    icon: Sparkles,
    title: "Experiencia que se nota",
    description: "Años de trabajo, clientes que vuelven y nos recomiendan.",
  },
  {
    icon: ShieldCheck,
    title: "Calidad que permanece",
    description: "Usamos repuestos de calidad y tecnología avanzada.",
  },
  {
    icon: Handshake,
    title: "Profesionalismo, calidad y confianza",
    description: "En cada servicio, de principio a fin.",
  },
]

const GUARANTEES = [
  { icon: Users, label: "Mecánicos expertos" },
  { icon: Cpu, label: "Tecnología avanzada" },
  { icon: BadgeCheck, label: "Garantía de servicio" },
]

export default async function LandingPage() {
  const services = await listPublishedServicePosts()
  const highlight = await getActiveHighlight()

  return (
    <>
      <section className="relative overflow-hidden px-4 pt-24 pb-28 text-center">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/brand/tccars-hero.jpg"
            alt=""
            fill
            priority
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background to-background" />
        </div>
        <FadeIn className="relative mx-auto max-w-3xl">
          <p className="text-sm font-semibold tracking-widest text-primary uppercase">
            Servicio automotriz · La Florida, Santiago
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-6xl">
            Más de 15 años
            <br />
            <span className="text-primary">cuidando lo que te mueve.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-muted-foreground">
            Mantenciones, afinamientos, embragues y scanner con mecánicos expertos y tecnología
            avanzada. Agenda tu cita y llévate tu auto en las mejores manos.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/contacto">Agenda tu cita</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/servicios">Ver servicios</Link>
            </Button>
          </div>
        </FadeIn>
      </section>

      {highlight ? <HighlightBanner highlight={highlight} /> : null}

      <section className="border-t border-border/60 bg-card/40 px-4 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
          {WHY_US.map((item, i) => (
            <FadeIn key={item.title} delay={i * 0.1} className="text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-primary/40 text-primary">
                <item.icon className="size-6" />
              </div>
              <h3 className="mt-4 font-bold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {services.length > 0 ? (
        <section className="px-4 py-20">
          <div className="mx-auto max-w-5xl">
            <FadeIn className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-foreground">Nuestros servicios</h2>
              <p className="mt-2 text-muted-foreground">
                Donde la experiencia marca la diferencia.
              </p>
            </FadeIn>
            <ServiceIconStrip services={services.slice(0, 5)} />
            <div className="mt-10 text-center">
              <Button asChild variant="outline">
                <Link href="/servicios">Ver todos los servicios</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t border-border/60 px-4 py-20 text-center">
        <FadeIn className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-foreground">
            Comprometidos con la excelencia automotriz
          </h2>
          <p className="mt-3 text-muted-foreground">
            Donde la experiencia marca la diferencia.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/contacto">Contáctanos ahora</Link>
          </Button>
        </FadeIn>
      </section>

      <section className="border-t border-border/60 bg-card/40 px-4 py-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-8 sm:flex-row sm:gap-14">
          {GUARANTEES.map((item, i) => (
            <FadeIn
              key={item.label}
              delay={i * 0.08}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
            >
              <item.icon className="size-5 text-primary" />
              {item.label}
            </FadeIn>
          ))}
        </div>
      </section>
    </>
  )
}
