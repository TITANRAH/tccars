"use client"

import { useTransition } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { UploadButton } from "@/lib/uploadthing-client"
import {
  addMaintenanceImageAction,
  deleteMaintenanceImageAction,
} from "@/features/maintenances/actions/maintenance.actions"

export function MaintenanceImages({
  maintenanceId,
  images,
  readOnly = false,
}: {
  maintenanceId: string
  images: { id: string; url: string }[]
  readOnly?: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div>
      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin imágenes todavía.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
              <Image src={image.url} alt="" fill className="object-cover" unoptimized />
              {!readOnly ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteMaintenanceImageAction(image.id, maintenanceId)
                      toast.success("Imagen eliminada")
                    })
                  }
                  className="absolute top-1 right-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Eliminar
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
      {!readOnly ? (
        <div className="mt-4">
          <UploadButton
            endpoint="maintenanceImage"
            onClientUploadComplete={(res) => {
              startTransition(async () => {
                for (const file of res) {
                  await addMaintenanceImageAction(maintenanceId, file.ufsUrl)
                }
                toast.success(`${res.length} imagen(es) subida(s)`)
              })
            }}
            onUploadError={(error) => {
              toast.error(`Error al subir imagen: ${error.message}`)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
