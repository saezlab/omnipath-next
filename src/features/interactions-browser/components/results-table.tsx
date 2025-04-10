"use client"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SearchProteinNeighborsResponse } from "@/features/interactions-browser/api/queries"
import { EntityBadge } from "@/components/EntityBadge"
import { cn } from "@/lib/utils"
import { ArrowRight, ArrowUpDown, Atom, Dna, FlaskConical, Mic, Minus } from "lucide-react"
import { useState } from "react"

interface ResultsTableProps {
  currentResults: SearchProteinNeighborsResponse['interactions']
  onSelectInteraction: (interaction: SearchProteinNeighborsResponse['interactions'][number]) => void
  searchTerm: string
}

const INTERACTION_TYPE_ICONS: Record<string, { icon: React.ReactNode; label: string }> = {
  post_translational: { icon: <Atom className="h-4 w-4" />, label: "Post-translational" },
  transcriptional: { icon: <Dna className="h-4 w-4" />, label: "Transcriptional" },
  post_transcriptional: { icon: <Dna className="h-4 w-4" />, label: "Post-transcriptional" },
  mirna_transcriptional: { icon: <Mic className="h-4 w-4" />, label: "miRNA Transcriptional" },
  small_molecule_protein: { icon: <FlaskConical className="h-4 w-4" />, label: "Small Molecule-Protein" },
}

export function ResultsTable({ currentResults, onSelectInteraction, searchTerm }: ResultsTableProps) {
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)

  const getInteractionColor = (interaction: SearchProteinNeighborsResponse['interactions'][number]) => {
    if (interaction.isStimulation) return "text-green-500"
    if (interaction.isInhibition) return "text-red-500"
    return "text-orange-500"
  }

  const getInteractionTypeIcon = (type: string | null) => {
    if (!type) return { icon: <Atom className="h-4 w-4" />, label: "Unknown" }
    return INTERACTION_TYPE_ICONS[type] || { icon: <Atom className="h-4 w-4" />, label: type }
  }

  const getReferenceCount = (interaction: SearchProteinNeighborsResponse['interactions'][number]) => {
    return interaction.references ? interaction.references.split(";").length : 0
  }

  const filteredAndSortedResults = currentResults
    .filter(interaction => {
      if (!searchTerm) return true
      const searchLower = searchTerm.toLowerCase()
      return (
        interaction.sourceGenesymbol?.toLowerCase().includes(searchLower) ||
        interaction.source?.toLowerCase().includes(searchLower) ||
        interaction.targetGenesymbol?.toLowerCase().includes(searchLower) ||
        interaction.target?.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      if (!sortDirection) return 0
      const countA = getReferenceCount(a)
      const countB = getReferenceCount(b)
      return sortDirection === 'asc' ? countA - countB : countB - countA
    })

  const toggleSort = () => {
    setSortDirection(prev => {
      if (prev === null) return 'asc'
      if (prev === 'asc') return 'desc'
      return null
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-center">Interaction</TableHead>
          <TableHead className="hidden lg:table-cell">Sources</TableHead>
          <TableHead 
            className="hidden lg:table-cell cursor-pointer"
            onClick={toggleSort}
          >
            <div className="flex items-center gap-2">
              References
              <ArrowUpDown className="h-4 w-4" />
              {sortDirection && (
                <span className="text-xs text-muted-foreground">
                  ({sortDirection === 'asc' ? 'asc' : 'desc'})
                </span>
              )}
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredAndSortedResults.map((interaction, index) => {
          const typeIcon = getInteractionTypeIcon(interaction.type)
          const sources = interaction.sources || []
          
          return (
            <TableRow
              key={index}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelectInteraction(interaction)}
            >
              <TableCell>
                <div className="flex items-center justify-center gap-4">
                  <EntityBadge 
                    geneSymbol={interaction.sourceGenesymbol || ''} 
                    uniprotId={interaction.source || ''} 
                  />
                  
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-muted-foreground">
                            {typeIcon.icon}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{typeIcon.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <div className={cn("flex items-center", getInteractionColor(interaction))}>
                      {interaction.isDirected ? (
                        <ArrowRight className="h-6 w-6" />
                      ) : (
                        <Minus className="h-6 w-6" />
                      )}
                    </div>
                  </div>

                  <EntityBadge 
                    geneSymbol={interaction.targetGenesymbol || ''} 
                    uniprotId={interaction.target || ''} 
                  />
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {sources.slice(0, 3).map((source, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {source}
                          </Badge>
                        ))}
                        {sources.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{sources.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent 
                      className="max-w-[300px] p-3 bg-popover border shadow-lg"
                      side="top"
                      align="start"
                    >
                      <div className="flex flex-wrap gap-1">
                        {sources.map((source, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {getReferenceCount(interaction)}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

