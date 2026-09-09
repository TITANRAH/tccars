"use client"

import { ConfirmActionButton } from "@/components/admin/confirm-action-button"
import { deleteHighlightAction } from "@/features/highlight/actions/highlight.actions"

export function DeleteHighlightButton({ highlightId }: { highlightId: string }) {
  return (
    <ConfirmActionButton
      label="Eliminar destacado"
      title="¿Eliminar este destacado?"
      description="Se borra el registro y su imagen. Esta acción no se puede deshacer."
      confirmLabel="Eliminar"
      onConfirm={() => deleteHighlightAction(highlightId)}
    />
  )
}
