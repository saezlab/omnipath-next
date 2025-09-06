"use client"
import { AboutSection } from "@/components/home/about-section"
import { AIAssistantCard } from "@/components/home/ai-assistant-card"
import { FeatureCard } from "@/components/home/feature-card"
import { HeroSection } from "@/components/home/hero-section"
import { ResourcesTable } from "@/components/home/resources-table"
import { Database, Download, FileText, Filter, FlaskConical, MapPin, Network, Search, Tag, Users } from "lucide-react"
import CombinedDatabaseVisualization from '@/components/home/combined-database-visualization';
export function HomePage() {
  return (
    <>
      <HeroSection />

      <div className="container py-8 mx-auto px-4 sm:px-6">
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 lg:items-stretch">
          <FeatureCard
            icon={<Database className="h-6 w-6 text-primary" />}
            title="Explore 5 Integrated Databases"
            description="Search across all molecular data types in one unified interface"
            features={[
              {
                icon: <Network className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />,
                title: "Molecular Interactions",
                description: "Protein-protein, transcriptional, and signaling interactions",
              },
              {
                icon: <Tag className="h-4 w-4 mt-0.5 text-secondary flex-shrink-0" />,
                title: "Functional Annotations",
                description: "GO terms, pathways, localization, and biological properties",
              },
              {
                icon: <Users className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />,
                title: "Complexes & Communication",
                description: "Protein complexes, enzyme-substrate, and intercellular roles",
              },
            ]}
            href="/search"
            buttonText="Search All Databases"
          />

          <AIAssistantCard />
        </div>


    
        {/* Combined Database Visualization Section */}
        <section className="mt-16">
          <div className="w-full overflow-x-auto">
            <div className="flex justify-center">
              <CombinedDatabaseVisualization />
            </div>
          </div>
        </section>

        {/* Resources Table Section */}
        <section className="mt-16">
          <ResourcesTable />
        </section>

        <AboutSection />
      </div>
    </>
  )
}

