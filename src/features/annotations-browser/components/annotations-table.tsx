"use client"

import { ColumnDef, ResultsTable } from "@/components/shared/results-table"
import type React from "react"
import { useMemo } from "react"

interface Annotation {
  uniprot: string | null
  genesymbol: string | null
  entityType: string | null
  source: string | null
  label: string | null
  value: string | null
  recordId: number | null
}

interface PivotedAnnotation {
  recordId: number
  source: string
  geneSymbol: string | null
  uniprotId: string | null
  values: Record<string, string> // key: "source:label", value: annotation value
  [key: string]: unknown // Index signature for DataRow compatibility
}

interface AnnotationsTableProps {
  currentResults: Annotation[]
  getCategoryIcon: (label: string | null) => React.ReactNode
  getCategoryColor: (label: string | null) => string
  uniqueRecordCount: number
  isMultiQuery?: boolean
}

function pivotAnnotations(annotations: Annotation[]): Record<string, PivotedAnnotation[]> {
  const pivotedBySource: Record<string, Record<number, PivotedAnnotation>> = {};
  
  annotations.forEach(annotation => {
    if (!annotation.recordId || !annotation.source) return;
    
    const source = annotation.source;
    if (!pivotedBySource[source]) {
      pivotedBySource[source] = {};
    }
    
    if (!pivotedBySource[source][annotation.recordId]) {
      pivotedBySource[source][annotation.recordId] = {
        recordId: annotation.recordId,
        source: source,
        geneSymbol: annotation.genesymbol,
        uniprotId: annotation.uniprot,
        values: {}
      };
    }
    
    const key = annotation.label || '';
    pivotedBySource[source][annotation.recordId].values[key] = annotation.value || '';
  });
  
  const result: Record<string, PivotedAnnotation[]> = {};
  Object.keys(pivotedBySource).forEach(source => {
    result[source] = Object.values(pivotedBySource[source]);
  });
  
  return result;
}

export function AnnotationsTable({
  currentResults,
  isMultiQuery = false,
}: AnnotationsTableProps) {
  const pivotedData = useMemo(() => pivotAnnotations(currentResults), [currentResults]);
  
  // Get unique column headers for each source
  const columnHeadersBySource = useMemo(() => {
    const headers: Record<string, string[]> = {};
    Object.entries(pivotedData).forEach(([source, rows]) => {
      const sourceHeaders = new Set<string>();
      rows.forEach(row => {
        Object.keys(row.values).forEach(key => {
          sourceHeaders.add(key);
        });
      });
      headers[source] = Array.from(sourceHeaders).sort();
    });
    return headers;
  }, [pivotedData]);

  if (currentResults.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No annotations found matching the current filters.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 w-full max-w-full">
      {Object.entries(pivotedData).map(([source, rows]) => {
        const headers = columnHeadersBySource[source];
        
        // Create dynamic columns based on headers
        const columns: ColumnDef<PivotedAnnotation>[] = [];
        
        // Add gene symbol column for multi-query scenarios
        if (isMultiQuery) {
          columns.push({
            accessorKey: "geneSymbol",
            header: "Gene Symbol",
            headerClassName: "px-2 py-2 text-xs border-r border-border/20 bg-muted/50 font-medium",
            cellClassName: "px-2 py-2 text-xs border-r border-border/20 bg-muted/20 font-medium",
            cell: ({ row }) => row.geneSymbol || "-"
          });
        }
        
        // Add annotation value columns
        headers.forEach(header => {
          columns.push({
            accessorKey: header,
            header: header,
            headerClassName: "px-2 py-2 text-xs border-r border-border/20 last:border-r-0",
            cellClassName: "px-2 py-2 text-xs border-r border-border/20 last:border-r-0",
            cell: ({ row }) => row.values[header] || "-"
          });
        });
        
        return (
          <ResultsTable<PivotedAnnotation>
            key={source}
            columns={columns}
            data={rows}
            title={source}
            titleCount={rows.length}
            showExport={true}
            exportFilenamePrefix={`${source}_annotations`}
            showSearch={false}
            resultsPerPage={100}
            infiniteScroll={false}
            maxHeight="max-h-[400px]"
            tableClassName="min-w-full"
          />
        );
      })}
    </div>
  )
}