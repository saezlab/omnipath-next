"use client"

import { Network, Tag, Filter, FileText, Download, MapPin, Users, BarChart3 } from "lucide-react"
import { SiteLayout } from "@/components/layout/site-layout"
import { HeroSection } from "@/components/home/hero-section"
import { SearchBar } from "@/components/shared/search-bar"
import { FeatureCard } from "@/components/home/feature-card"
import { AIAssistantCard } from "@/components/home/ai-assistant-card"
import { AboutSection } from "@/components/home/about-section"

export function HomePage() {
  return (
    <SiteLayout>
      <HeroSection />

      <div className="border-b py-4 px-4 bg-background">
        <div className="container max-w-2xl mx-auto">
          <SearchBar redirectPath="/interactions" />
        </div>
      </div>

      <div className="container py-8 mx-auto">
        <div className="grid gap-6 md:grid-cols-2">
          <FeatureCard
            icon={<Network className="h-6 w-6 text-blue-700" />}
            title="Interactions Browser"
            description="Explore protein-protein interactions, signaling pathways, and molecular networks"
            features={[
              {
                icon: <Filter className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />,
                title: "Advanced Filtering",
                description: "Filter by interaction type, direction, and more",
              },
              {
                icon: <Network className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />,
                title: "Network Visualization",
                description: "Visualize interaction networks graphically",
              },
              {
                icon: <FileText className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />,
                title: "Reference Tracking",
                description: "Access original publications and sources",
              },
              {
                icon: <Download className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />,
                title: "Data Export",
                description: "Download results in multiple formats",
              },
            ]}
            href="/interactions"
            buttonText="Browse Interactions"
          />

          <FeatureCard
            icon={<Tag className="h-6 w-6 text-green-700" />}
            title="Annotations Browser"
            description="Discover functional annotations, localizations, and biological properties"
            features={[
              {
                icon: <Tag className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />,
                title: "Functional Annotations",
                description: "GO terms, pathways, and functions, and more",
              },
              {
                icon: <MapPin className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />,
                title: "Localization Data",
                description: "Cellular and subcellular locations",
              },
              {
                icon: <Users className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />,
                title: "Intercellular Roles",
                description: "Ligands, receptors, and signaling",
              },
              {
                icon: <BarChart3 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />,
                title: "Data Visualization",
                description: "Charts and statistical analysis",
              },
            ]}
            href="/annotations"
            buttonText="Browse Annotations"
          />
        </div>

        <div className="mt-6 flex justify-center">
          <AIAssistantCard />
        </div>

        <AboutSection />
      </div>
    </SiteLayout>
  )
}

