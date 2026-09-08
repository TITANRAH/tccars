import Link from "next/link"
import { requireRole } from "@/lib/auth-guards"
import { listServicePosts } from "@/features/catalog-services/services/service-post.service"
import { ServicePostsTable } from "@/features/catalog-services/components/service-posts-table"
import { Button } from "@/components/ui/button"
import { ListSearch } from "@/components/admin/list-search"
import { ListPagination } from "@/components/admin/list-pagination"

export const metadata = { title: "Servicios — Panel admin" }

export default async function AdminServicePostsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  await requireRole("ADMIN")
  const { q = "", page: pageParam = "1" } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1)

  const { items: servicePosts, totalPages } = await listServicePosts(q, page)

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
        ← Volver al panel
      </Link>
      <div className="mt-2 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Servicios publicados</h1>
        <Button asChild>
          <Link href="/admin/servicios/nuevo">+ Nuevo servicio</Link>
        </Button>
      </div>
      <div className="mb-6">
        <ListSearch basePath="/admin/servicios" placeholder="Buscar por nombre..." />
      </div>
      <ServicePostsTable servicePosts={servicePosts} />
      <ListPagination
        basePath="/admin/servicios"
        page={page}
        totalPages={totalPages}
        extraParams={q ? { q } : {}}
      />
    </div>
  )
}
