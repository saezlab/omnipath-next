export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40 mt-auto">
      <div className="container flex mx-auto gap-4 py-10 md:flex-row md:items-center md:justify-center md:py-6 mx-auto">
        <div className="flex flex-col gap-1 text-center">
          <p className="text-sm text-muted-foreground">© 2025 OmniPath Explorer. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">
            Integrating data from over 150 resources to provide comprehensive molecular biology knowledge
          </p>
        </div>
      </div>
    </footer>
  )
}

