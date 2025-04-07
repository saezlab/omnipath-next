import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b">
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Explore the Molecular Universe</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          OmniPath integrates data from over 100 resources to provide a comprehensive view of molecular interactions,
          pathways, and biological annotations.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/interactions">Explore Interactions</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/annotations">Browse Annotations</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

