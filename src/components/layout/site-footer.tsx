import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40 mt-auto">
      <div className="container flex flex-col gap-4 py-10 md:flex-row md:items-center md:justify-between md:py-6 mx-auto">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">© 2025 OmniPath Explorer. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">
            Integrating data from over 100 resources to provide comprehensive molecular biology knowledge
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="#" className="text-sm text-muted-foreground hover:underline">
            Privacy
          </Link>
          <Link href="#" className="text-sm text-muted-foreground hover:underline">
            Terms
          </Link>
          <Link href="#" className="text-sm text-muted-foreground hover:underline">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
}

