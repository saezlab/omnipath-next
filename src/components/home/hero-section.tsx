import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-500/5 dark:via-indigo-500/5 dark:to-purple-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),rgba(0,0,0,0))]" />
      <div className="container relative mx-auto py-24 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
          Explore the Molecular Universe
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          OmniPath integrates data from over 100 resources to provide a comprehensive view of molecular interactions,
          pathways, and biological annotations.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600" asChild>
            <Link href="/interactions">Explore Interactions</Link>
          </Button>
          <Button size="lg" variant="outline" className="border-2 hover:bg-muted/50" asChild>
            <Link href="/annotations">Browse Annotations</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

