"use client"

import type React from "react"

import { useState } from "react"
import { ProteinCatalog } from "./protein-catalog"
import { AnnotationsBrowser } from "./annotations-browser"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Search,
  Network,
  Tag,
  History,
  Bookmark,
  ArrowRight,
  Database,
  Home,
  Layers,
  Users,
  MessageSquare,
  Filter,
  FileText,       
  BarChart3,
  Download,
  MapPin,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Sample recent searches and bookmarks for demo
const RECENT_SEARCHES = [
  { id: 1, query: "TP53", type: "protein" },
  { id: 2, query: "EGFR", type: "protein" },
  { id: 3, query: "mTORC1", type: "complex" },
  { id: 4, query: "IL6", type: "protein" },
]

const BOOKMARKS = [
  { id: 1, name: "TP53", description: "Tumor protein p53", type: "protein" },
  { id: 2, name: "EGFR-EGF", description: "EGFR-EGF interaction", type: "interaction" },
  { id: 3, name: "mTORC1", description: "mTOR Complex 1", type: "complex" },
]

// Link component for footer
const Link = ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) => (
  <a href={href} className={className}>
    {children}
  </a>
)

export default function OmnipathBrowser() {
  const [activeView, setActiveView] = useState<"home" | "interactions" | "annotations">("home")
  const [query, setQuery] = useState("")
  const [searchHistory, setSearchHistory] = useState(RECENT_SEARCHES)
  const [bookmarks, setBookmarks] = useState(BOOKMARKS)
  const [lastSearchedEntity, setLastSearchedEntity] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [chatMessage, setChatMessage] = useState("")

  // Handle search
  const handleSearch = () => {
    if (!query.trim()) return

    setIsSearching(true)
    setLastSearchedEntity(query)

    // Add to search history
    const newSearch = { id: Date.now(), query, type: "unknown" }
    setSearchHistory((prev) => [newSearch, ...prev.slice(0, 9)])

    // Determine which view to show based on query
    // For demo purposes, we'll just switch to interactions view
    setActiveView("interactions")

    setIsSearching(false)
  }

  // Handle bookmark toggle
  const toggleBookmark = (item: (typeof BOOKMARKS)[0]) => {
    const exists = bookmarks.some((b) => b.id === item.id)

    if (exists) {
      setBookmarks((prev) => prev.filter((b) => b.id !== item.id))
    } else {
      setBookmarks((prev) => [item, ...prev])
    }
  }

  // Get entity type color
  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case "protein":
        return "bg-blue-100 text-blue-800"
      case "gene":
        return "bg-green-100 text-green-800"
      case "complex":
        return "bg-purple-100 text-purple-800"
      case "interaction":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Tabs
        value={activeView}
        onValueChange={(value) => setActiveView(value as "home" | "interactions" | "annotations")}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 w-full border-b bg-background">
          <div className="container flex h-16 items-center px-4">
            <div className="flex items-center gap-2 mr-4">
              <Database className="h-6 w-6" />
              <h1 className="text-xl font-bold tracking-tight">OmniPath</h1>
            </div>

            <div className="flex-1 flex justify-center">
              {/* Centered TabsList */}
              <TabsList>
                <TabsTrigger value="home" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Home</span>
                </TabsTrigger>
                <TabsTrigger value="interactions" className="flex items-center gap-1">
                  <Network className="h-4 w-4" />
                  <span className="hidden sm:inline">Interactions</span>
                </TabsTrigger>
                <TabsTrigger value="annotations" className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  <span className="hidden sm:inline">Annotations</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <History className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <div className="flex items-center justify-between px-3 py-2">
                    <h4 className="font-medium">Recent Searches</h4>
                    <Button variant="ghost" size="sm" onClick={() => setSearchHistory([])}>
                      Clear
                    </Button>
                  </div>
                  <ScrollArea className="h-[300px]">
                    {searchHistory.length > 0 ? (
                      searchHistory.map((item) => (
                        <DropdownMenuItem
                          key={item.id}
                          onClick={() => {
                            setQuery(item.query)
                            setActiveView("interactions")
                          }}
                          className="flex items-center gap-2 py-2"
                        >
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p>{item.query}</p>
                          </div>
                          <Badge className={`${getEntityTypeColor(item.type)} text-xs`}>{item.type}</Badge>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-3 py-6 text-center text-muted-foreground">
                        <p>No recent searches</p>
                      </div>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <div className="flex items-center justify-between px-3 py-2">
                    <h4 className="font-medium">Bookmarks</h4>
                  </div>
                  <ScrollArea className="h-[300px]">
                    {bookmarks.length > 0 ? (
                      bookmarks.map((item) => (
                        <DropdownMenuItem
                          key={item.id}
                          onClick={() => {
                            setQuery(item.name)
                            setActiveView(item.type === "interaction" ? "interactions" : "annotations")
                          }}
                          className="flex items-center gap-2 py-2"
                        >
                          <Bookmark className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p>{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                          <Badge className={`${getEntityTypeColor(item.type)} text-xs`}>{item.type}</Badge>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-3 py-6 text-center text-muted-foreground">
                        <p>No bookmarks</p>
                      </div>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Hero Section - only shown on home page */}
          {activeView === "home" && (
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b">
              <div className="container mx-auto py-12 px-4 text-center">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Explore the Molecular Universe</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                  OmniPath integrates data from over 100 resources to provide a comprehensive view of molecular
                  interactions, pathways, and biological annotations.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button size="lg" onClick={() => setActiveView("interactions")}>
                    Explore Interactions
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => setActiveView("annotations")}>
                    Browse Annotations
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Global Search Bar - only shown on home page */}
          {activeView === "home" && (
            <div className="border-b py-4 px-4 bg-background">
              <div className="container max-w-2xl mx-auto">
                <div className="flex w-full items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search for proteins, genes, complexes, or interactions..."
                      className="w-full pl-9"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <TabsContent value="home" className="mt-0">
            <div className="container py-8">
              {/* Updated layout: 2 cards in first row, AI Assistant in second row */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Updated Interactions Browser Card with more content */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                      <Network className="h-6 w-6 text-blue-700" />
                    </div>
                    <CardTitle>Interactions Browser</CardTitle>
                    <CardDescription>
                      Explore protein-protein interactions, signaling pathways, and molecular networks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <Filter className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium">Advanced Filtering</p>
                          <p className="text-muted-foreground">Filter by interaction type, direction, and more</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Network className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium">Network Visualization</p>
                          <p className="text-muted-foreground">Visualize interaction networks graphically</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium">Reference Tracking</p>
                          <p className="text-muted-foreground">Access original publications and sources</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Download className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium">Data Export</p>
                          <p className="text-muted-foreground">Download results in multiple formats</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={() => setActiveView("interactions")}>
                      Browse Interactions
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>

                {/* Updated Annotations Browser Card with more content */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                      <Tag className="h-6 w-6 text-green-700" />
                    </div>
                    <CardTitle>Annotations Browser</CardTitle>
                    <CardDescription>
                      Discover functional annotations, localizations, and biological properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <Tag className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium">Functional Annotations</p>
                          <p className="text-muted-foreground">GO terms, pathways, and functions</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium">Localization Data</p>
                          <p className="text-muted-foreground">Cellular and subcellular locations</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium">Intercellular Roles</p>
                          <p className="text-muted-foreground">Ligands, receptors, and signaling</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <BarChart3 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium">Data Visualization</p>
                          <p className="text-muted-foreground">Charts and statistical analysis</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={() => setActiveView("annotations")}>
                      Browse Annotations
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* AI Assistant in its own row - more minimalistic */}
              <div className="mt-6 flex justify-center">
                <Card className="md:w-1/2 relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-purple-500 to-pink-500"></div>
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant="outline"
                      className="border-amber-500 text-amber-600 font-medium px-2 py-1 flex items-center gap-1"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      Coming Soon
                    </Badge>
                  </div>
                  <CardHeader className="pb-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                      <MessageSquare className="h-6 w-6 text-purple-700" />
                    </div>
                    <CardTitle>OmniPath AI Assistant</CardTitle>
                    <CardDescription>
                      Get help finding information about proteins, interactions, and biological pathways
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm">
                          Hello! I can help you find information about proteins, interactions, and biological pathways.
                          What would you like to know?
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Input
                          placeholder="Ask about a protein or pathway..."
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          disabled
                        />
                        <Button className="w-full" disabled>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Ask AI Assistant
                        </Button>
                      </div>

                      <div className="text-xs text-center text-muted-foreground mt-2">
                        Powered by advanced AI models trained on biological data
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* About OmniPath Section */}
              <section className="container px-4 py-8 bg-muted/20 rounded-lg my-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tighter">About OmniPath</h2>
                    <p className="mt-4 text-muted-foreground">
                      OmniPath is a database of molecular biology prior knowledge, combining data from over 100
                      resources to build 5 integrated databases:
                    </p>
                    <ul className="mt-4 space-y-2">
                      <li className="flex items-start gap-2">
                        <Network className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <span>Signaling network (interactions)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Layers className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <span>Enzyme-PTM relationships</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Database className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <span>Protein complexes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Tag className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <span>Protein annotations (function, localization, tissue, disease, structure)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <span>Intercellular communication roles (ligand, receptor, intercell)</span>
                      </li>
                    </ul>
                    <Button className="mt-6">Read Our Publication</Button>
                  </div>
                  <div className="bg-card rounded-lg border p-6">
                    <h3 className="font-medium mb-4">OmniPath Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-md bg-muted p-4 text-center">
                        <div className="text-2xl font-bold">100+</div>
                        <div className="text-sm text-muted-foreground">Data Resources</div>
                      </div>
                      <div className="rounded-md bg-muted p-4 text-center">
                        <div className="text-2xl font-bold">5</div>
                        <div className="text-sm text-muted-foreground">Integrated Databases</div>
                      </div>
                      <div className="rounded-md bg-muted p-4 text-center">
                        <div className="text-2xl font-bold">500K+</div>
                        <div className="text-sm text-muted-foreground">Interactions</div>
                      </div>
                      <div className="rounded-md bg-muted p-4 text-center">
                        <div className="text-2xl font-bold">20K+</div>
                        <div className="text-sm text-muted-foreground">Proteins</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="interactions" className="mt-0 flex-1">
            <ProteinCatalog />
          </TabsContent>

          <TabsContent value="annotations" className="mt-0 flex-1">
            <AnnotationsBrowser />
          </TabsContent>
        </main>

        {/* Context-aware floating action button for quick switching */}
        {(activeView === "interactions" || activeView === "annotations") && lastSearchedEntity && (
          <div className="fixed bottom-6 right-6">
            <Button
              size="lg"
              className="rounded-full shadow-lg"
              onClick={() => setActiveView(activeView === "interactions" ? "annotations" : "interactions")}
            >
              {activeView === "interactions" ? (
                <>
                  <Tag className="mr-2 h-4 w-4" />
                  View Annotations
                </>
              ) : (
                <>
                  <Network className="mr-2 h-4 w-4" />
                  View Interactions
                </>
              )}
            </Button>
          </div>
        )}
      </Tabs>

      {/* Footer */}
      <footer className="border-t bg-muted/40 mt-auto">
        <div className="container flex flex-col gap-4 py-10 md:flex-row md:items-center md:justify-between md:py-6 mx-auto">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">© 2025 OmniPath Explorer. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">
              Integrating data from over 100 resources to provide comprehensive molecular biology knowledge
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              Terms
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

