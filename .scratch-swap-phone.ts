import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./src/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.user.updateMany({
    where: { firstName: "Admin", lastName: "TC Cars", role: "ADMIN" },
    data: { phone: null },
  })
  const updated = await prisma.user.updateMany({
    where: { firstName: "Colaborador", lastName: "QA", role: "COLLABORATOR" },
    data: { phone: "56954743944" },
  })
  console.log("colaborador qa updated:", updated.count)
}

main().finally(() => prisma.$disconnect())
