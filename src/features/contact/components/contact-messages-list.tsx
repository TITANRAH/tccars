"use client"

import { useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/format"
import { markContactMessageReadAction } from "@/features/contact/actions/mark-read.action"
import type { ContactMessage } from "@/generated/prisma/client"

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
