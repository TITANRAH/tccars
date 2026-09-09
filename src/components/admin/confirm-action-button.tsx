"use client"

import type { ReactNode } from "react"
import { useTransition } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"

export function ConfirmActionButton({
  label,
  title,
  description,
  confirmLabel = "Confirmar",
  variant = "destructive",
  onConfirm,
  disabled,
}: {
  label: ReactNode
  title: string
  description?: string
  confirmLabel?: string
  variant?: ButtonVariant
  onConfirm: () => void | Promise<void>
  disabled?: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant={variant} disabled={disabled || isPending}>
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant={variant} onClick={() => startTransition(onConfirm)}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
