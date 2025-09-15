"use client"
import { AboutSection } from "@/components/home/about-section"
import { FeatureCard } from "@/components/home/feature-card"
import { HeroSection } from "@/components/home/hero-section"
import { ResourcesTable } from "@/components/home/resources-table"
import { Database, MessageSquare, Filter, Download, FileText, History, Code } from "lucide-react"
// import CombinedDatabaseVisualization from '@/components/home/combined-database-visualization';
export function HomePage() {
  return (
    <>
      <HeroSection />

      <div className="container py-8 mx-auto px-4 sm:px-6">
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 lg:items-stretch">
          <FeatureCard
            icon={<Database className="h-6 w-6 text-primary" />}
            title="Explore 5 Integrated Databases"
            description="Explore general molecular- and enzyme-substrate interactions, annotations, intercellular communication, complexes in one unified interface"
            features={[
              {
                icon: <Filter className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />,
                title: "Advanced Filtering",
                description: "Filter by organism, data source, and more",
              },
              {
                icon: <FileText className="h-4 w-4 mt-0.5 text-secondary flex-shrink-0" />,
                title: "Provenance Tracking",
                description: "Track data sources and original publications",
              },
              {
                icon: <Download className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />,
                title: "Data Export (TSV)",
                description: "Export filtered results in tab-separated format",
              },
            ]}
            href="/search"
            buttonText="Search All Databases"
          />

          <FeatureCard
            icon={<MessageSquare className="h-6 w-6 text-accent-foreground" />}
            title="OmniPath AI Assistant"
            description="Get help finding information about proteins, interactions, pathways and more."
            features={[
              {
                icon: <Code className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />,
                title: "Transform Queries to SQL",
                description: "Convert natural language to database queries",
              },
              {
                icon: <History className="h-4 w-4 mt-0.5 text-secondary flex-shrink-0" />,
                title: "Message History",
                description: "Access and continue previous conversations",
              },
              {
                icon: <MessageSquare className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />,
                title: "Interactive Chat",
                description: "Ask follow-up questions and get detailed explanations",
              },
            ]}
            href="/chat"
            buttonText="Start Chat"
          />
        </div>


    
        {/* Combined Database Visualization Section */}
        {/* <section className="mt-16">
          <div className="w-full overflow-x-auto">
            <div className="flex justify-center">
              <CombinedDatabaseVisualization />
            </div>
          </div>
        </section> */}

        {/* Resources Table Section */}
        <section className="mt-16">
          <ResourcesTable />
        </section>

        <AboutSection />
      </div>
    </>
  )
}

