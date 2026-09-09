import { Readable } from "node:stream"
import { google } from "googleapis"

const ROOT_FOLDER_NAME = "Fichas TC Cars"
const FOLDER_MIME = "application/vnd.google-apps.folder"

function getOAuthDriveClient() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    return null
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret)
  auth.setCredentials({ refresh_token: refreshToken })

  return google.drive({ version: "v3", auth })
}

type DriveClient = NonNullable<ReturnType<typeof getOAuthDriveClient>>

async function findOrCreateFolder(drive: DriveClient, name: string, parentId?: string) {
  const parentClause = parentId ? `and '${parentId}' in parents` : "and 'root' in parents"
  const escapedName = name.replace(/'/g, "\\'")
  const query = `name = '${escapedName}' and mimeType = '${FOLDER_MIME}' and trashed = false ${parentClause}`

  const existing = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive",
  })

  const found = existing.data.files?.[0]
  if (found?.id) return found.id

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: FOLDER_MIME,
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id",
  })

  if (!created.data.id) {
    throw new Error(`No se pudo crear la carpeta "${name}" en Drive`)
  }
  return created.data.id
}

function bufferToStream(buffer: Buffer) {
  return Readable.from(buffer)
}

/**
 * Sube (o sobrescribe, si ya existe fileId) la ficha PDF en
 * "Fichas TC Cars/<PATENTE>/<AAAA-MM-DD>-<tipo>/ficha.pdf". Best-effort: el
 * llamador decide qué hacer si esto falla, nunca debe bloquear la entrega de
 * la ficha al cliente.
 */
export async function backupFichaToDrive(params: {
  patente: string
  date: Date
  tipo: string
  buffer: Buffer
  existingFileId?: string | null
}) {
  const drive = getOAuthDriveClient()
  if (!drive) {
    throw new Error(
      "Google Drive (OAuth) no está configurado (faltan GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET / GOOGLE_DRIVE_REFRESH_TOKEN)"
    )
  }

  const pad = (n: number) => String(n).padStart(2, "0")
  const dateFolder = `${params.date.getFullYear()}-${pad(params.date.getMonth() + 1)}-${pad(params.date.getDate())}-${params.tipo}`

  if (params.existingFileId) {
    await drive.files.update({
      fileId: params.existingFileId,
      media: { mimeType: "application/pdf", body: bufferToStream(params.buffer) },
    })
    return params.existingFileId
  }

  const rootId = await findOrCreateFolder(drive, ROOT_FOLDER_NAME)
  const patenteId = await findOrCreateFolder(drive, params.patente.toUpperCase(), rootId)
  const visitId = await findOrCreateFolder(drive, dateFolder, patenteId)

  const created = await drive.files.create({
    requestBody: { name: "ficha.pdf", mimeType: "application/pdf", parents: [visitId] },
    media: { mimeType: "application/pdf", body: bufferToStream(params.buffer) },
    fields: "id",
  })

  if (!created.data.id) {
    throw new Error("No se pudo subir la ficha a Drive")
  }
  return created.data.id
}
