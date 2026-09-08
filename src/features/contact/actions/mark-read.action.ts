"use server"

import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth-guards"
import { markContactMessageRead } from "@/features/contact/services/contact.service"

export async function markContactMessageReadAction(id: string) {
  await requireRole("ADMIN")
  await markContactMessageRead(id)
  revalidatePath("/admin/mensajes")
}
