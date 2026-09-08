import { ContactForm } from "@/features/contact/components/contact-form"
import { FadeIn } from "@/components/motion/fade-in"
import {
  listBusinessHours,
  listUpcomingBusinessHoursExceptions,
} from "@/features/business-hours/services/business-hours.service"
import { BusinessHoursDisplay } from "@/features/business-hours/components/business-hours-display"

export const metadata = { title: "Contacto — TC Cars" }

export default async function ContactPage() {
  const [days, exceptions] = await Promise.all([
    listBusinessHours(),
    listUpcomingBusinessHoursExceptions(),
  ])

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <FadeIn className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-foreground">Contáctanos</h1>
        <p className="mt-2 text-muted-foreground">
          Cuéntanos qué necesita tu vehículo y te contactaremos a la brevedad.
        </p>
      </FadeIn>
      <FadeIn delay={0.05} className="mb-10">
        <BusinessHoursDisplay days={days} exceptions={exceptions} />
      </FadeIn>
      <FadeIn delay={0.1}>
        <ContactForm />
      </FadeIn>
    </div>
  )
}
