import { prisma } from "@/lib/prisma"
import type { HighlightInput } from "@/features/highlight/schemas/highlight.schema"

/**
 * Solo existe "el destacado actual" desde la perspectiva del sitio público —
 * el más reciente marcado como activo. El admin puede guardar varios en el
 * tiempo (historial), pero el sitio siempre muestra uno solo.
 */
export function getActiveHighlight() {
  return prisma.highlight.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  })
}

/**
 * El que se precarga en el formulario de /admin/destacado — el más reciente,
 * esté activo o no (para poder reactivarlo/editarlo).
 */
export function getLatestHighlight() {
  return prisma.highlight.findFirst({ orderBy: { updatedAt: "desc" } })
}

export function getHighlight(id: string) {
  return prisma.highlight.findUnique({ where: { id } })
}

function toData(input: HighlightInput) {
  return {
    title: input.title,
    description: input.description,
    imageUrl: input.imageUrl || null,
    ctaLabel: input.ctaLabel,
    ctaHref: input.ctaHref,
    active: input.active,
  }
}

export function createHighlight(input: HighlightInput) {
  return prisma.highlight.create({ data: toData(input) })
}

export function updateHighlight(id: string, input: HighlightInput) {
  return prisma.highlight.update({ where: { id }, data: toData(input) })
}

export function deleteHighlight(id: string) {
  return prisma.highlight.delete({ where: { id } })
}
