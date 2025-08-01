import { Network, Layers, Database, Tag, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AboutSection() {
  return (
    <section className="container p-4 relative mt-12">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 dark:from-primary/10 dark:via-secondary/10 dark:to-accent/10 rounded-2xl" />
      <div className="relative grid md:grid-cols-2 gap-8 items-center p-2 sm:p-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
            About OmniPath
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            OmniPath is a database of molecular biology prior knowledge, combining data from over 150 resources to build
            5 integrated databases:
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/30 hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Network className="h-5 w-5 text-primary" />
              </div>
              <span>Signaling network (interactions)</span>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/30 hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 dark:bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <Layers className="h-5 w-5 text-secondary" />
              </div>
              <span>Enzyme-PTM relationships</span>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/30 hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="w-8 h-8 rounded-lg bg-accent/10 dark:bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Database className="h-5 w-5 text-accent-foreground" />
              </div>
              <span>Protein complexes</span>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/30 hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <span>Protein annotations (function, localization, tissue, disease, structure)</span>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/30 hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 dark:bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <span>Intercellular communication roles (ligand, receptor, intercell)</span>
            </li>
          </ul>
          <a href="https://www.embopress.org/doi/full/10.15252/msb.20209923" target="_blank" rel="noopener noreferrer">
            <Button className="mt-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
              Read Our Publication
            </Button>
          </a>
        </div>
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <h3 className="font-medium text-lg mb-6">OmniPath Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted/50 dark:bg-muted/30 p-4 text-center hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">150+</div>
              <div className="text-sm text-muted-foreground">Data Resources</div>
            </div>
            <div className="rounded-lg bg-muted/50 dark:bg-muted/30 p-4 text-center hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-secondary to-accent">5</div>
              <div className="text-sm text-muted-foreground">Integrated Databases</div>
            </div>
            <div className="rounded-lg bg-muted/50 dark:bg-muted/30 p-4 text-center hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary">1M+</div>
              <div className="text-sm text-muted-foreground">Interactions</div>
            </div>
            <div className="rounded-lg bg-muted/50 dark:bg-muted/30 p-4 text-center hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">5M+</div>
              <div className="text-sm text-muted-foreground">Annotations</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

