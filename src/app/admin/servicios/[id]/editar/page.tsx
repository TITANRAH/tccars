import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth-guards"
import { getServicePost } from "@/features/catalog-services/services/service-post.service"
import { ServicePostForm } from "@/features/catalog-services/components/service-post-form"

export const metadata = { title: "Editar servicio — Panel admin" }

export default async function EditServicePostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const { id } = await params
  const servicePost = await getServicePost(id)
  if (!servicePost) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-bold">Editar servicio</h1>
      <ServicePostForm
        servicePost={{
          id: servicePost.id,
          title: servicePost.title,
          slug: servicePost.slug,
          description: servicePost.description,
          imageUrl: servicePost.imageUrl ?? "",
          order: servicePost.order,
          published: servicePost.published,
        }}
      />
    </div>
  )
}
