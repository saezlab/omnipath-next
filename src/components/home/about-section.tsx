import { Network, Layers, Database, Tag, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AboutSection() {
  return (
    <section className="container px-4 py-12 relative mt-12">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-purple-500/10 rounded-2xl" />
      <div className="relative grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
            About OmniPath
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            OmniPath is a database of molecular biology prior knowledge, combining data from over 100 resources to build
            5 integrated databases:
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/30 hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Network className="h-5 w-5 text-blue-700 dark:text-blue-400" />
              </div>
              <span>Signaling network (interactions)</span>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/30 hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                <Layers className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
              </div>
              <span>Enzyme-PTM relationships</span>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/30 hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <Database className="h-5 w-5 text-purple-700 dark:text-purple-400" />
              </div>
              <span>Protein complexes</span>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/30 hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                <Tag className="h-5 w-5 text-pink-700 dark:text-pink-400" />
              </div>
              <span>Protein annotations (function, localization, tissue, disease, structure)</span>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/30 hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-amber-700 dark:text-amber-400" />
              </div>
              <span>Intercellular communication roles (ligand, receptor, intercell)</span>
            </li>
          </ul>
          <Button className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600">
            Read Our Publication
          </Button>
        </div>
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <h3 className="font-medium text-lg mb-6">OmniPath Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted/50 dark:bg-muted/30 p-4 text-center hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">100+</div>
              <div className="text-sm text-muted-foreground">Data Resources</div>
            </div>
            <div className="rounded-lg bg-muted/50 dark:bg-muted/30 p-4 text-center hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">5</div>
              <div className="text-sm text-muted-foreground">Integrated Databases</div>
            </div>
            <div className="rounded-lg bg-muted/50 dark:bg-muted/30 p-4 text-center hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">500K+</div>
              <div className="text-sm text-muted-foreground">Interactions</div>
            </div>
            <div className="rounded-lg bg-muted/50 dark:bg-muted/30 p-4 text-center hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors duration-300">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-amber-600 dark:from-pink-400 dark:to-amber-400">20K+</div>
              <div className="text-sm text-muted-foreground">Proteins</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

