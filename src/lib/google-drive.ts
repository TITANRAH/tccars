import { google } from "googleapis"

function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!email || !privateKey) {
    return null
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  })

  return google.drive({ version: "v3", auth })
}

export class DriveNotConfiguredError extends Error {}

/**
 * Descarga un archivo de Drive (ej. la "ficha" que llena n8n) usando la
 * cuenta de servicio. La carpeta de Drive debe estar compartida con el
 * email de esa cuenta de servicio (rol Lector) para que esto funcione.
 */
export async function downloadDriveFile(fileId: string) {
  const drive = getDriveClient()
  if (!drive) {
    throw new DriveNotConfiguredError(
      "Google Drive no está configurado (faltan GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)"
    )
  }

  const metadata = await drive.files.get({
    fileId,
    fields: "name, mimeType",
  })

  const file = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  )

  return {
    name: metadata.data.name ?? "ficha",
    mimeType: metadata.data.mimeType ?? "application/octet-stream",
    buffer: Buffer.from(file.data as ArrayBuffer),
  }
}
