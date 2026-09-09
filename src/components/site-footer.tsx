import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Image src="/brand/logo.png" alt="TC Cars" width={110} height={91} />
            <p className="mt-1">Más de 15 años cuidando lo que te mueve.</p>
          </div>
          <div className="space-y-1">
            <p>Av. Vicuña Mackenna 9320, La Florida, Santiago</p>
            <p>
              <a href="https://wa.me/56934517178" className="hover:text-primary">
                +56 9 3451 7178
              </a>{" "}
              ·{" "}
              <a
                href="https://instagram.com/tccars.cl"
                className="hover:text-primary"
                target="_blank"
                rel="noreferrer"
              >
                @tccars.cl
              </a>
            </p>
          </div>
          <Button asChild>
            <Link href="/contacto">Contáctanos</Link>
          </Button>
        </div>
        <p className="mt-6 pr-16 text-xs text-muted-foreground/70 sm:pr-0">
          © {new Date().getFullYear()} TC Cars. Todos los derechos reservados. ·{" "}
          <Link href="/politica-privacidad" className="hover:text-primary">
            Política de privacidad
          </Link>
        </p>
      </div>
    </footer>
  )
}
