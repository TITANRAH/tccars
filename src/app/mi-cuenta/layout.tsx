import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"

const WHATSAPP_NUMBER = "56934517178"
const WHATSAPP_MESSAGE = "Hola TC Cars, quiero agendar una hora para mi vehículo."

/**
 * Sin este wrapper, cada página quedaría como hijo directo del <body> (flex
 * flex-col en el layout raíz) y el "mx-auto max-w-*" de cada página se
 * encogería al contenido en vez de estirarse — un div flex con margin auto
 * no hace stretch. El w-full de abajo rompe esa cadena flex.
 *
 * También da a esta sección lo que no tenía por no compartir el layout
 * público: una forma de volver al sitio y de agendar por WhatsApp.
 */
export default function MiCuentaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/brand/logo.png" alt="TC Cars" width={40} height={33} />
          </Link>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-1.5 text-sm font-medium text-white transition-transform hover:scale-105"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.38a9.94 9.94 0 0 0 4.79 1.22h.01c5.52 0 10-4.48 10-10s-4.48-9.84-10.01-9.84Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.35c0-4.52 3.68-8.2 8.21-8.2 2.19 0 4.25.85 5.8 2.4a8.14 8.14 0 0 1 2.4 5.8c0 4.52-3.68 8.21-8.17 8.21Zm4.5-6.14c-.25-.12-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.12-.16.25-.63.8-.78.96-.14.16-.29.18-.53.06-.25-.12-1.05-.39-2-1.23a7.5 7.5 0 0 1-1.38-1.72c-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.04 0 1.2.88 2.36 1 2.52.12.16 1.74 2.66 4.22 3.72.59.25 1.05.4 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.46-.6 1.67-1.18.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.47-.28Z" />
            </svg>
            Agendar por WhatsApp
          </a>
        </div>
      </header>
      {children}
    </div>
  )
}
