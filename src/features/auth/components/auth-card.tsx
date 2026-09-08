import Link from "next/link"
import type { ReactNode } from "react"

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="w-full max-w-md">
      <Link
        href="/"
        className="mb-8 block text-center text-2xl font-extrabold tracking-tight text-primary"
      >
        TC <span className="text-foreground">CARS</span>
      </Link>
      <div className="rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/40">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
        <div className="mt-6">{children}</div>
      </div>
      {footer ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      ) : null}
    </div>
  )
}
