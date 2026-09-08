"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { iconForServiceSlug } from "@/features/catalog-services/service-icons"
import type { ServicePost } from "@/generated/prisma/client"

export function ServiceIconStrip({ services }: { services: ServicePost[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {services.map((service, i) => {
        const Icon = iconForServiceSlug(service.slug)
        return (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
            whileHover={{ y: -6 }}
          >
            <Link
              href={`/servicios/${service.slug}`}
              className="group flex flex-col items-center gap-3 rounded-xl border border-primary/30 px-4 py-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
            >
              <span className="flex size-14 items-center justify-center rounded-full border border-primary/40 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:border-primary">
                <Icon className="size-7" strokeWidth={1.75} />
              </span>
              <span className="text-sm font-bold tracking-wide text-primary uppercase">
                {service.title}
              </span>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
