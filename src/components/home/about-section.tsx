import { Network, Layers, Database, Tag, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AboutSection() {
  return (
    <section className="container px-4 py-8 bg-muted/20 rounded-lg my-8">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter">About OmniPath</h2>
          <p className="mt-4 text-muted-foreground">
            OmniPath is a database of molecular biology prior knowledge, combining data from over 100 resources to build
            5 integrated databases:
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
  )
}

