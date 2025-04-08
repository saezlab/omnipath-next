"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchProteinNeighborsResponse } from "@/features/interactions-browser/api/queries"
interface ResultsTableProps {
  currentResults: SearchProteinNeighborsResponse['interactions']
  onSelectInteraction: (interaction: SearchProteinNeighborsResponse['interactions'][number]) => void
}

export function ResultsTable({ currentResults, onSelectInteraction }: ResultsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Source (Gene)</TableHead>
          <TableHead>Target (Gene)</TableHead>
          <TableHead className="hidden md:table-cell">Type</TableHead>
          <TableHead className="hidden lg:table-cell">Direction</TableHead>
          <TableHead className="hidden lg:table-cell">References</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {currentResults.map((interaction, index) => (
          <TableRow
            key={index}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onSelectInteraction(interaction)}
          >
            <TableCell>
              <div className="flex flex-col">
                <span>{interaction.source}</span>
                <span className="text-sm text-muted-foreground">{interaction.sourceGenesymbol}</span>
                <span className="text-xs text-muted-foreground md:hidden">{interaction.type}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{interaction.target}</span>
                <span className="text-sm text-muted-foreground">{interaction.targetGenesymbol}</span>
                <span className="text-xs text-muted-foreground lg:hidden">
                  {interaction.isDirected ? "Directed" : "Undirected"}
                  {interaction.isStimulation && " (Stim)"}
                  {interaction.isInhibition && " (Inhib)"}
                </span>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">{interaction.type}</TableCell>
            <TableCell className="hidden lg:table-cell">
              {interaction.isDirected ? "Directed" : "Undirected"}
              {interaction.isStimulation && " (Stimulation)"}
              {interaction.isInhibition && " (Inhibition)"}
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              {interaction.references ? interaction.references.split(";").length : 0}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

