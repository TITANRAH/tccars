import { PrismaClient } from "./src/generated/prisma/client.js"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()
const action = process.argv[2]

if (action === "create") {
  const passwordHash = await bcrypt.hash("QaAdmin123!", 12)
  const user = await prisma.user.upsert({
    where: { email: "admin.qa@tccars.test" },
    update: { passwordHash, role: "ADMIN", active: true },
    create: {
      email: "admin.qa@tccars.test",
      firstName: "QA",
      lastName: "Admin",
      passwordHash,
      role: "ADMIN",
      active: true,
      emailVerified: new Date(),
    },
  })
  console.log("created", user.id)
} else if (action === "delete") {
  await prisma.user.deleteMany({ where: { email: "admin.qa@tccars.test" } })
  console.log("deleted")
}

await prisma.$disconnect()
