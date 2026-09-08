"use client"

import { useTransition } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { UploadButton } from "@/lib/uploadthing-client"
import { compressImages } from "@/lib/compress-image"
import {
  addMaintenanceImageAction,
  deleteMaintenanceImageAction,
} from "@/features/maintenances/actions/maintenance.actions"

const MAX_IMAGES = 20

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
  const limitReached = images.length >= MAX_IMAGES

  return (
    <div>
      <div className="mb-2 text-xs text-muted-foreground">
        {images.length} / {MAX_IMAGES} imágenes
      </div>
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
          {limitReached ? (
            <p className="text-sm text-muted-foreground">
              Llegaste al máximo de {MAX_IMAGES} imágenes para esta mantención. Elimina alguna
              para subir otra.
            </p>
          ) : (
            <UploadButton
              endpoint="maintenanceImage"
              onBeforeUploadBegin={compressImages}
              onClientUploadComplete={(res) => {
                startTransition(async () => {
                  let uploaded = 0
                  for (const file of res) {
                    const result = await addMaintenanceImageAction(maintenanceId, file.ufsUrl)
                    if (!result.success) {
                      toast.error(result.error)
                      break
                    }
                    uploaded++
                  }
                  if (uploaded > 0) toast.success(`${uploaded} imagen(es) subida(s)`)
                })
              }}
              onUploadError={(error) => {
                toast.error(`Error al subir imagen: ${error.message}`)
              }}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}
