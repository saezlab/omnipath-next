import { SearchHeader } from "@/features/search/components/search-header"

export function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      <div className="container relative mx-auto pt-24 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
          Explore the Molecular Universe
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
OmniPath integrates data from 160+ resources to provide a comprehensive view of molecular interactions, pathways, and biological annotations.        </p>
        
        {/* Search Component */}
        <div className="max-w-4xl mx-auto mb-8">
          <SearchHeader 
            identifierResults={{}}
            activeTab="interactions"
            selectedSpecies="9606"
          />
        </div>

      </div>
    </div>
  )
}

