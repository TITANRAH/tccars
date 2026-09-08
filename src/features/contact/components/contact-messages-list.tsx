"use client"

import { useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/format"
import { markContactMessageReadAction } from "@/features/contact/actions/mark-read.action"
import type { ContactMessage } from "@/generated/prisma/client"

function whatsappHref(message: ContactMessage) {
  if (!message.phone) return null
  const digits = message.phone.replace(/[^\d]/g, "")
  const text =
    `Hola ${message.name}, gracias por contactar a TC Cars. ` +
    `Para agendar tu hora necesitamos: la patente de tu vehículo, marca y modelo, ` +
    `qué necesita el auto, y qué día/horario te acomoda. ¡Quedamos atentos!`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export function ContactMessagesList({ messages }: { messages: ContactMessage[] }) {
  const [isPending, startTransition] = useTransition()

  if (messages.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay mensajes de contacto todavía.</p>
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-foreground">{message.name}</p>
              <p className="text-xs text-muted-foreground">
                {message.email}
                {message.phone ? ` · ${message.phone}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={message.status === "NUEVO" ? "default" : "secondary"}>
                {message.status}
              </Badge>
              {whatsappHref(message) ? (
                <Button size="sm" asChild>
                  <a href={whatsappHref(message)!} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                </Button>
              ) : null}
              {message.status === "NUEVO" ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => startTransition(() => markContactMessageReadAction(message.id))}
                >
                  Marcar leído
                </Button>
              ) : null}
            </div>
          </div>
          <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">
            {message.message}
          </p>
          <p className="mt-3 text-xs text-muted-foreground/70">
            {formatDateTime(message.createdAt)}
          </p>
        </div>
      ))}
    </div>
  )
}
