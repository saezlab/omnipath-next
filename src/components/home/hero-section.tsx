import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      <div className="container relative mx-auto py-24 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
          Explore Molecular Prior Knowledge
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          OmniPath integrates data from 150+ resources across 5 comprehensive databases: molecular interactions,
          functional annotations, protein complexes, enzyme-substrate relationships, and intercellular communication.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" className="bg-gradient-to-r from-primary to-secondary" asChild>
            <Link href="/search">Search Databases</Link>
          </Button>
          <Button size="lg" className="bg-gradient-to-r from-secondary to-primary" asChild>
            <Link href="/chat">Ask AI Assistant</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

