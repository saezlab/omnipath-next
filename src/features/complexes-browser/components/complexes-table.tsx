"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { ComplexEntry, ParsedComplex } from "@/features/complexes-browser/types"
import { ColumnDef, ResultsTable } from "@/components/shared/results-table"

interface ComplexesTableProps {
  entries: ComplexEntry[]
}

function parseComplexData(complex: ComplexEntry): ParsedComplex {
  const parsedComponents = complex.components?.split(/[;,]/).map(c => c.trim()).filter(Boolean) || []
  const parsedGeneSymbols = complex.componentsGenesymbols?.split(/[;,]/).map(g => g.trim()).filter(Boolean) || []
  const parsedSources = complex.sources?.split(/[;,]/).map(s => s.trim()).filter(Boolean) || []
  
  return {
    ...complex,
    parsedComponents,
    parsedGeneSymbols,
    parsedSources,
    componentCount: parsedGeneSymbols.length || parsedComponents.length
  }
}

const formatStoichiometry = (stoichiometry: string | null) => {
  if (!stoichiometry) return "-"
  // Parse stoichiometry like "2:1:1" or other formats
  const parts = stoichiometry.split(/[;,:]/).map(s => s.trim()).filter(Boolean)
  return (
    <div className="flex gap-1 flex-wrap">
      {parts.map((part, index) => (
        <Badge key={index} variant="outline" className="text-xs">
          {part}
        </Badge>
      ))}
    </div>
  )
}

export function ComplexesTable({ entries }: ComplexesTableProps) {
  const parsedEntries = entries.map(parseComplexData)
  
  const columns: ColumnDef<ParsedComplex>[] = [
    {
      accessorKey: 'name',
      header: 'Complex Name',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.name || <span className="text-muted-foreground">Unnamed complex</span>}
        </span>
      ),
    },
    {
      accessorKey: 'componentsGenesymbols',
      header: 'Components (Gene Symbols)',
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap max-w-md">
          {row.parsedGeneSymbols.slice(0, 5).map((gene, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {gene}
            </Badge>
          ))}
          {row.parsedGeneSymbols.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{row.parsedGeneSymbols.length - 5} more
            </Badge>
          )}
          {row.parsedGeneSymbols.length === 0 && (
            <span className="text-muted-foreground text-xs">No gene symbols</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'components',
      header: 'Components (UniProt)',
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap max-w-md">
          {row.parsedComponents.slice(0, 3).map((comp, index) => (
            <Badge key={index} variant="outline" className="text-xs font-mono">
              {comp}
            </Badge>
          ))}
          {row.parsedComponents.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{row.parsedComponents.length - 3} more
            </Badge>
          )}
          {row.parsedComponents.length === 0 && (
            <span className="text-muted-foreground text-xs">No UniProt IDs</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'stoichiometry',
      header: 'Stoichiometry',
      cell: ({ row }) => formatStoichiometry(row.stoichiometry),
    },
    {
      accessorKey: 'sources',
      header: 'Sources',
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap max-w-xs">
          {row.parsedSources.slice(0, 2).map((source, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {source}
            </Badge>
          ))}
          {row.parsedSources.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{row.parsedSources.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'references',
      header: 'References',
      cell: ({ row }) => row.references ? (
        <div className="max-w-xs">
          <span className="text-xs text-muted-foreground truncate block">
            {row.references.length > 100 ? `${row.references.substring(0, 100)}...` : row.references}
          </span>
        </div>
      ) : (
        <span className="text-muted-foreground text-xs">No references</span>
      ),
    },
    {
      accessorKey: 'identifiers',
      header: 'External Identifiers',
      cell: ({ row }) => {
        if (!row.identifiers) {
          return <span className="text-muted-foreground text-xs">No identifiers</span>;
        }
        
        const parsedIdentifiers = row.identifiers.split(/[;,]/).map(id => id.trim()).filter(Boolean);
        
        return (
          <div className="flex gap-1 flex-wrap max-w-xs">
            {parsedIdentifiers.slice(0, 3).map((identifier, index) => (
              <Badge key={index} variant="outline" className="text-xs font-mono">
                {identifier}
              </Badge>
            ))}
            {parsedIdentifiers.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{parsedIdentifiers.length - 3} more
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'componentCount',
      header: 'Component Count',
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant="secondary">{row.componentCount}</Badge>
      ),
    },
  ];

  if (entries.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No complexes found matching the current filters.</p>
      </div>
    )
  }

  return (
    <ResultsTable<ParsedComplex>
      columns={columns}
      data={parsedEntries}
      title="Complexes"
      titleCount={entries.length}
      showExport={true}
      exportFilenamePrefix="complexes_data"
      resultsPerPage={50}
      maxHeight="max-h-[600px]"
      initialSortKey="componentCount"
      initialSortDirection="desc"
    />
  );
}