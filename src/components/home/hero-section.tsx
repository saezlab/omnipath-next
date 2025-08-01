import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 dark:from-primary/5 dark:via-secondary/5 dark:to-accent/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.05),rgba(0,0,0,0))]" />
      <div className="container relative mx-auto py-24 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
          Explore the Molecular Universe
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          OmniPath integrates data from 150+ resources to provide a comprehensive view of molecular interactions,
          pathways, and biological annotations.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90" asChild>
            <Link href="/interactions">Explore Interactions</Link>
          </Button>
          <Button size="lg" variant="outline" className="border border-primary/20 hover:border-primary/40 hover:bg-muted/50 transition-all duration-200" asChild>
            <Link href="/annotations">Browse Annotations</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

