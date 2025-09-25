"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { ComplexEntry, ParsedComplex } from "@/features/complexes-browser/types"
import { ColumnDef, ResultsTable } from "@/components/shared/results-table"
import { SourcesDisplay } from "@/components/shared/sources-display"
import { EntityBadge } from "@/components/EntityBadge"

interface ComplexesTableProps {
  entries: ComplexEntry[]
  onSelectEntry?: (entry: ComplexEntry) => void
}

function parseComplexData(complex: ComplexEntry): ParsedComplex {
  const parsedComponents = complex.components?.split("_").map(c => c.trim()).filter(Boolean) || []
  const parsedGeneSymbols = complex.componentsGenesymbols?.split("_").map(g => g.trim()).filter(Boolean) || []
  const parsedSources = complex.sources?.split("_").map(s => s.trim()).filter(Boolean) || []
  
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
  const maxVisible = 3
  return (
    <div className="flex gap-1 flex-wrap">
      {parts.slice(0, maxVisible).map((part, index) => (
        <Badge key={index} variant="outline" className="text-xs">
          {part}
        </Badge>
      ))}
      {parts.length > maxVisible && (
        <Badge variant="outline" className="text-xs">
          +{parts.length - maxVisible} more
        </Badge>
      )}
    </div>
  )
}

export function ComplexesTable({ entries, onSelectEntry }: ComplexesTableProps) {
  const parsedEntries = entries.map(parseComplexData)
  
  const columns: ColumnDef<ParsedComplex>[] = [
    {
      accessorKey: 'name',
      header: 'Complex Name',
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <EntityBadge
            geneSymbol={row.name || row.componentsGenesymbols || 'Unknown'}
            uniprotId={row.components || ''}
            entityType="complex"
            maxChars={35}
            maxWidth="max-w-[200px]"
          />
        </div>
      ),
    },
    {
      accessorKey: 'components',
      header: 'Components',
      cell: ({ row }) => {
        const maxVisible = 3
        const totalComponents = Math.max(row.parsedGeneSymbols.length, row.parsedComponents.length)
        
        return (
          <div className="flex gap-1 flex-wrap max-w-md">
            {Array.from({ length: Math.min(totalComponents, maxVisible) }).map((_, index) => (
              <EntityBadge 
                key={index}
                geneSymbol={row.parsedGeneSymbols[index] || ""} 
                uniprotId={row.parsedComponents[index] || ""} 
              />
            ))}
            {totalComponents > maxVisible && (
              <Badge variant="outline" className="text-xs">
                +{totalComponents - maxVisible} more
              </Badge>
            )}
            {totalComponents === 0 && (
              <span className="text-muted-foreground text-xs">No components</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'stoichiometry',
      header: 'Stoichiometry',
      cell: ({ row }) => formatStoichiometry(row.stoichiometry),
    },
    {
      accessorKey: 'sources',
      header: 'Sources',
      cell: ({ row }) => {
        // Convert back to string for SourcesDisplay
        const sourcesString = row.parsedSources.join(';')
        return (
          <SourcesDisplay sources={sourcesString} maxVisible={2} inline className="max-w-xs" />
        )
      },
    },
    {
      accessorKey: 'references',
      header: 'References',
      cell: ({ row }) => row.references ? (
        <div className="max-w-xs">
          <span className="text-xs text-muted-foreground">
            {row.references.split(';').length} reference{row.references.split(';').length > 1 ? 's' : ''}
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
      onRowClick={(row) => onSelectEntry?.(row)}
    />
  );
}