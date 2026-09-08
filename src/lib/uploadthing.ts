import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"
import { auth } from "@/auth"

const f = createUploadthing()

async function requireUploaderRole(...roles: Array<"ADMIN" | "COLLABORATOR">) {
  const session = await auth()
  if (!session?.user || !roles.includes(session.user.role as "ADMIN" | "COLLABORATOR")) {
    throw new UploadThingError("No autorizado")
  }
  return session
}

export const ourFileRouter = {
  catalogImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await requireUploaderRole("ADMIN")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl }
    }),

  maintenanceImage: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } })
    .middleware(async () => {
      const session = await requireUploaderRole("ADMIN", "COLLABORATOR")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
