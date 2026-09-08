import Link from "next/link"
import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { MobileNav } from "@/components/mobile-nav"

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/productos", label: "Productos" },
  { href: "/contacto", label: "Contacto" },
]

function dashboardHrefForRole(role: "ADMIN" | "COLLABORATOR" | "CLIENT") {
  if (role === "ADMIN") return "/admin"
  if (role === "COLLABORATOR") return "/colaborador"
  return "/mi-cuenta"
}

export async function SiteHeader() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-primary">
          TC <span className="text-foreground">CARS</span>
        </Link>
        <nav className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <Button asChild size="sm">
              <Link href={dashboardHrefForRole(session.user.role)}>Mi panel</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/registro">Crear cuenta</Link>
              </Button>
            </>
          )}
          <MobileNav dashboardHref={session?.user ? dashboardHrefForRole(session.user.role) : null} />
        </div>
      </div>
    </header>
  )
}
