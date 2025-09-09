"use client"

import { Badge } from "@/components/ui/badge"
import type React from "react"
import { EnzSubEntry } from "../types"
import { ColumnDef, ResultsTable } from "@/components/shared/results-table"
import { SourcesDisplay } from "@/components/shared/sources-display"
import { EntityBadge } from "@/components/EntityBadge"

interface EnzSubTableProps {
  currentResults: EnzSubEntry[]
  onSelectEntry?: (entry: EnzSubEntry) => void
}

function formatResidue(residueType: string | null, residueOffset: number | null): string {
  if (!residueType) return "-"
  if (residueOffset !== null) {
    return `${residueType}${residueOffset}`
  }
  return residueType
}



export function EnzSubTable({
  currentResults,
  onSelectEntry,
}: EnzSubTableProps) {
  const columns: ColumnDef<EnzSubEntry>[] = [
    {
      accessorKey: 'enzyme',
      header: 'Enzyme',
      cell: ({ row }) => {
        return (
            <EntityBadge 
              geneSymbol={row.enzymeGenesymbol || ""} 
              uniprotId={row.enzyme || ""} 
            />
        )
      },
    },
    {
      accessorKey: 'substrate',
      header: 'Substrate',
      cell: ({ row }) => {
        return (
            <EntityBadge 
              geneSymbol={row.substrateGenesymbol || ""} 
              uniprotId={row.substrate || ""} 
            />
        )
      },
    },
    {
      accessorKey: 'modification',
      header: 'Modification',
      cell: ({ row }) => row.modification ? (
        <Badge variant="outline" className="text-xs">
          {row.modification}
        </Badge>
      ) : "-",
    },
    {
      accessorKey: 'residue',
      header: 'Residue',
      cell: ({ row }) => formatResidue(row.residueType, row.residueOffset),
    },
    {
      accessorKey: 'sources',
      header: 'Sources',
      cell: ({ row }) => (
        <SourcesDisplay sources={row.sources} maxVisible={3} inline className="max-w-[150px]" />
      ),
    },
    {
      accessorKey: 'references',
      header: 'References',
      cell: ({ row }) => row.references ? (
        <div className="max-w-[200px]">
          <span className="text-xs text-muted-foreground">
            {row.references.split(';').length}
          </span>
        </div>
      ) : (
        <span className="text-muted-foreground text-xs">0</span>
      ),
    },
  ];

  if (currentResults.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No enzyme-substrate relationships found matching the current filters.</p>
      </div>
    )
  }

  return (
    <ResultsTable<EnzSubEntry>
      columns={columns}
      data={currentResults}
      title="Enzyme-Substrate Relationships"
      titleCount={currentResults.length}
      showExport={true}
      exportFilenamePrefix="enzsub_relationships"
      infiniteScroll={true}
      resultsPerPage={30}
      maxHeight="h-full"
      onRowClick={onSelectEntry}
    />
  )
}