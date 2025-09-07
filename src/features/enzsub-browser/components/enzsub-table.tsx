"use client"

import { Badge } from "@/components/ui/badge"
import type React from "react"
import { EnzSubEntry } from "../types"
import { ColumnDef, ResultsTable } from "@/components/shared/results-table"
import { SourcesDisplay } from "@/components/shared/sources-display"
import { EntityBadge } from "@/components/EntityBadge"

interface EnzSubTableProps {
  currentResults: EnzSubEntry[]
  searchedProteins: Set<string>
  onSelectEntry?: (entry: EnzSubEntry) => void
}

function formatResidue(residueType: string | null, residueOffset: number | null): string {
  if (!residueType) return "-"
  if (residueOffset !== null) {
    return `${residueType}${residueOffset}`
  }
  return residueType
}

function getProteinRole(
  entry: EnzSubEntry, 
  searchedProteins: Set<string>
): { isEnzyme: boolean; isSubstrate: boolean } {
  const enzymeMatches = searchedProteins.has(entry.enzyme || '') || 
                       searchedProteins.has(entry.enzymeGenesymbol || '')
  const substrateMatches = searchedProteins.has(entry.substrate || '') || 
                          searchedProteins.has(entry.substrateGenesymbol || '')
  
  return {
    isEnzyme: enzymeMatches,
    isSubstrate: substrateMatches
  }
}


export function EnzSubTable({
  currentResults,
  searchedProteins,
  onSelectEntry,
}: EnzSubTableProps) {
  const columns: ColumnDef<EnzSubEntry>[] = [
    {
      accessorKey: 'enzyme',
      header: 'Enzyme',
      cell: ({ row }) => {
        const role = getProteinRole(row, searchedProteins)
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
        const role = getProteinRole(row, searchedProteins)
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
            {row.references.split(';').length} reference{row.references.split(';').length > 1 ? 's' : ''}
          </span>
        </div>
      ) : (
        <span className="text-muted-foreground text-xs">No references</span>
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