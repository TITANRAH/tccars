import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const CORE_SERVICES = [
  {
    title: "Ajustes de Motor",
    slug: "ajustes-de-motor",
    description:
      "Diagnóstico y ajuste completo de motor para que tu vehículo rinda al máximo y con menor consumo.",
    order: 1,
  },
  {
    title: "Afinamientos",
    slug: "afinamientos",
    description:
      "Afinamiento completo: bujías, filtros y puesta a punto para una conducción suave y segura.",
    order: 2,
  },
  {
    title: "Embragues",
    slug: "embragues",
    description: "Revisión, ajuste y cambio de embrague con repuestos de calidad garantizada.",
    order: 3,
  },
  {
    title: "Scanner",
    slug: "scanner",
    description:
      "Escaneo computarizado para detectar fallas con tecnología avanzada antes de que se conviertan en un problema mayor.",
    order: 4,
  },
  {
    title: "Mantenciones",
    slug: "mantenciones",
    description:
      "Mantención preventiva y correctiva para que tu auto esté siempre listo para el camino.",
    order: 5,
  },
]

async function main() {
  for (const service of CORE_SERVICES) {
    await prisma.servicePost.upsert({
      where: { slug: service.slug },
      update: {},
      create: { ...service, published: true },
    })
  }
  console.log(`Servicios base: ${CORE_SERVICES.length} listos.`)

  const adminEmail = process.env.SEED_ADMIN_EMAIL
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12)
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN", emailVerified: new Date() },
      create: {
        email: adminEmail,
        firstName: "Admin",
        lastName: "TC Cars",
        passwordHash,
        role: "ADMIN",
        emailVerified: new Date(),
      },
    })
    console.log(`Usuario admin listo: ${adminEmail}`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
