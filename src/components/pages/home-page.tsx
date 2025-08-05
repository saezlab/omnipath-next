"use client"
import { AboutSection } from "@/components/home/about-section"
import { AIAssistantCard } from "@/components/home/ai-assistant-card"
import { FeatureCard } from "@/components/home/feature-card"
import { HeroSection } from "@/components/home/hero-section"
import { SiteLayout } from "@/components/layout/main-layout"
import { Download, FileText, Filter, MapPin, Network, Tag, Users } from "lucide-react"
import DatabaseGridVisualization from "@/components/home/database-grid-visualization";
import { AuxiliaryChartsPanel } from "@/components/home/auxiliary-charts-panel";
export function HomePage() {
  return (
    <SiteLayout>
      <HeroSection />

      <div className="container py-8 mx-auto px-2">
        <div className="grid gap-6 lg:grid-cols-2">
          <FeatureCard
            icon={<Network className="h-6 w-6 text-primary" />}
            title="Interactions Browser"
            description="Explore undirected, directed and causal molecular interactions"
            features={[
              {
                icon: <Filter className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />,
                title: "Advanced Filtering",
                description: "Filter by interaction type, direction, and more",
              },
              {
                icon: <FileText className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />,
                title: "Reference Tracking",
                description: "Access original publications and sources",
              },
              {
                icon: <Download className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />,
                title: "Data Export",
                description: "Download results in multiple formats",
              },
            ]}
            href="/interactions"
            buttonText="Browse Interactions"
          />

          <FeatureCard
            icon={<Tag className="h-6 w-6 text-secondary" />}
            title="Annotations Browser"
            description="Discover functional annotations, localizations, and biological properties"
            features={[
              {
                icon: <Tag className="h-4 w-4 mt-0.5 text-secondary flex-shrink-0" />,
                title: "Functional Annotations",
                description: "GO terms, pathways, and functions, and more",
              },
              {
                icon: <MapPin className="h-4 w-4 mt-0.5 text-secondary flex-shrink-0" />,
                title: "Localization Data",
                description: "Cellular and subcellular locations",
              },
              {
                icon: <Users className="h-4 w-4 mt-0.5 text-secondary flex-shrink-0" />,
                title: "Intercellular Roles",
                description: "Ligands, receptors, and signaling",
              },
            ]}
            href="/annotations"
            buttonText="Browse Annotations"
          />
        </div>

        <div className="mt-6 flex justify-center">
          <AIAssistantCard />
        </div>

        <div className="mt-12">
          <DatabaseGridVisualization />
        </div>
        <div className="mt-12">
          <AuxiliaryChartsPanel />
        </div>

        <AboutSection />
      </div>
    </SiteLayout>
  )
}

