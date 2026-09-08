import { requireRole } from "@/lib/auth-guards"
import { ServicePostForm } from "@/features/catalog-services/components/service-post-form"

export const metadata = { title: "Nuevo servicio — Panel admin" }

export default async function NewServicePostPage() {
  await requireRole("ADMIN")

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold">Nuevo servicio</h1>
      <ServicePostForm />
    </div>
  )
}
