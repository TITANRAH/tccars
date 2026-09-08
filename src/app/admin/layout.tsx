import type { ReactNode } from "react"

/**
 * Sin este wrapper, cada página quedaría como hijo directo del <body> (flex
 * flex-col en el layout raíz) y el "mx-auto max-w-*" de cada página se
 * encogería al contenido en vez de estirarse — un div flex con margin auto
 * no hace stretch. Este div w-full rompe esa cadena flex.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="w-full">{children}</div>
}
