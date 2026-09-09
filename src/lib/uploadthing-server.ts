import { UTApi } from "uploadthing/server"

const utapi = new UTApi()

/**
 * Borra un archivo de UploadThing a partir de su URL pública (ej.
 * https://<app>.ufs.sh/f/<key>) — el key es el último segmento de la ruta.
 */
export async function deleteUploadThingFile(url: string) {
  const key = url.split("/").pop()
  if (!key) return
  await utapi.deleteFiles(key)
}
