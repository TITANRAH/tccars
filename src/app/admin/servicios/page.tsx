import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { listServicePosts } from "@/features/catalog-services/services/service-post.service"
import { ServicePostsTable } from "@/features/catalog-services/components/service-posts-table"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Servicios — Panel admin" }

export default async function AdminServicePostsPage() {
  await requireRole("ADMIN")
  const servicePosts = await listServicePosts()

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Servicios publicados</h1>
        <Button asChild>
          <Link href="/admin/servicios/nuevo">+ Nuevo servicio</Link>
        </Button>
      </div>
      <ServicePostsTable servicePosts={servicePosts} />
    </div>
  )
}
