"use client"

import { Badge } from "@/components/ui/badge"
import type React from "react"
import { EnzSubEntry } from "../types"
import { ColumnDef, ResultsTable } from "@/components/shared/results-table"

interface EnzSubTableProps {
  currentResults: EnzSubEntry[]
  searchedProteins: Set<string>
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

function RoleIndicator({ isEnzyme, isSubstrate }: { isEnzyme: boolean; isSubstrate: boolean }) {
  return (
    <div className="flex gap-1">
      {isEnzyme && (
        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
          E
        </Badge>
      )}
      {isSubstrate && (
        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          S
        </Badge>
      )}
    </div>
  )
}

function CurationEffortIndicator({ effort }: { effort: number | null }) {
  if (effort === null) return <span className="text-muted-foreground">-</span>
  
  const getColor = () => {
    if (effort >= 3) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
    if (effort >= 2) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
  }
  
  return (
    <Badge variant="secondary" className={`text-xs ${getColor()}`}>
      {effort}
    </Badge>
  )
}

export function EnzSubTable({
  currentResults,
  searchedProteins,
}: EnzSubTableProps) {
  const columns: ColumnDef<EnzSubEntry>[] = [
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = getProteinRole(row, searchedProteins)
        return (
          <RoleIndicator 
            isEnzyme={role.isEnzyme} 
            isSubstrate={role.isSubstrate} 
          />
        )
      },
    },
    {
      accessorKey: 'enzyme',
      header: 'Enzyme',
      cell: ({ row }) => {
        const role = getProteinRole(row, searchedProteins)
        return (
          <div className="space-y-1">
            <div className={`font-medium ${role.isEnzyme ? 'text-blue-600 dark:text-blue-400' : ''}`}>
              {row.enzymeGenesymbol || row.enzyme || "-"}
            </div>
            {row.enzymeGenesymbol && row.enzyme && (
              <div className="text-xs text-muted-foreground">
                {row.enzyme}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'substrate',
      header: 'Substrate',
      cell: ({ row }) => {
        const role = getProteinRole(row, searchedProteins)
        return (
          <div className="space-y-1">
            <div className={`font-medium ${role.isSubstrate ? 'text-green-600 dark:text-green-400' : ''}`}>
              {row.substrateGenesymbol || row.substrate || "-"}
            </div>
            {row.substrateGenesymbol && row.substrate && (
              <div className="text-xs text-muted-foreground">
                {row.substrate}
              </div>
            )}
          </div>
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
      cell: ({ row }) => row.sources ? (
        <div className="flex flex-wrap gap-1 max-w-[150px]">
          {row.sources.split(';').slice(0, 3).map((source, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {source.trim()}
            </Badge>
          ))}
          {row.sources.split(';').length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{row.sources.split(';').length - 3} more
            </span>
          )}
        </div>
      ) : "-",
    },
    {
      accessorKey: 'curationEffort',
      header: 'Curation',
      enableSorting: true,
      cell: ({ row }) => (
        <CurationEffortIndicator effort={row.curationEffort} />
      ),
    },
    {
      accessorKey: 'references',
      header: 'References',
      cell: ({ row }) => row.references ? (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.references.split(';').slice(0, 2).map((ref, index) => (
            <span key={index} className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded">
              {ref.trim()}
            </span>
          ))}
          {row.references.split(';').length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{row.references.split(';').length - 2} more
            </span>
          )}
        </div>
      ) : "-",
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
      resultsPerPage={50}
      maxHeight="h-full"
      initialSortKey="curationEffort"
      initialSortDirection="desc"
    />
  )
}