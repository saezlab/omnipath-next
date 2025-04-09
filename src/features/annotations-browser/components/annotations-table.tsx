"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
}

interface AnnotationsTableProps {
  currentResults: Annotation[]
  onSelectAnnotation: (annotation: Annotation) => void
  getCategoryIcon: (label: string | null) => React.ReactNode
  getCategoryColor: (label: string | null) => string
}

function pivotAnnotations(annotations: Annotation[]): PivotedAnnotation[] {
  const pivoted: Record<number, PivotedAnnotation> = {};
  
  annotations.forEach(annotation => {
    if (!annotation.recordId) return;
    
    if (!pivoted[annotation.recordId]) {
      pivoted[annotation.recordId] = {
        recordId: annotation.recordId,
        source: annotation.source || '',
        geneSymbol: annotation.genesymbol,
        uniprotId: annotation.uniprot,
        values: {}
      };
    }
    
    const key = `${annotation.source}:${annotation.label}`;
    pivoted[annotation.recordId].values[key] = annotation.value || '';
  });
  
  return Object.values(pivoted);
}

export function AnnotationsTable({
  currentResults,
  onSelectAnnotation,
}: AnnotationsTableProps) {
  const pivotedData = useMemo(() => pivotAnnotations(currentResults), [currentResults]);
  
  // Get unique column headers from the pivoted data
  const columnHeaders = useMemo(() => {
    const headers = new Set<string>();
    pivotedData.forEach(row => {
      Object.keys(row.values).forEach(key => {
        headers.add(key);
      });
    });
    return Array.from(headers).sort();
  }, [pivotedData]);

  if (currentResults.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No annotations found matching the current filters.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Record ID</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Gene Symbol</TableHead>
          <TableHead>UniProt ID</TableHead>
          {columnHeaders.map(header => (
            <TableHead key={header}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {pivotedData.map((row) => (
          <TableRow
            key={row.recordId}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onSelectAnnotation(currentResults.find(a => a.recordId === row.recordId)!)}
          >
            <TableCell>{row.recordId}</TableCell>
            <TableCell>{row.source}</TableCell>
            <TableCell>{row.geneSymbol}</TableCell>
            <TableCell>{row.uniprotId}</TableCell>
            {columnHeaders.map(header => (
              <TableCell key={`${row.recordId}-${header}`}>
                {row.values[header] || "-"}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}