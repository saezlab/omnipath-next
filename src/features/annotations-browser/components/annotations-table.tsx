"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { exportToTSV } from "@/lib/utils/export"
import { Download } from "lucide-react"
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
  getCategoryIcon: (label: string | null) => React.ReactNode
  getCategoryColor: (label: string | null) => string
  uniqueRecordCount: number
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

  const handleExport = (source: string, rows: PivotedAnnotation[]) => {
    const data = rows.map(row => {
      const rowData: Record<string, string> = {
        'Gene Symbol': row.geneSymbol || '',
        'UniProt ID': row.uniprotId || '',
        ...row.values
      };
      return rowData;
    });
    exportToTSV(data, `${source}_annotations`);
  };

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
        const totalItems = rows.length;
        
        return (
          <div key={source} className="w-full max-w-full flex flex-col">
            <div className="w-full max-w-full overflow-hidden border border-primary/20 hover:border-primary/40 shadow-sm hover:shadow-md bg-background rounded-lg transition-all duration-200 flex flex-col">
              <div className="flex flex-row items-center justify-between space-y-0 p-4 bg-background flex-shrink-0 min-w-0">
                <div className="flex items-center space-x-2 min-w-0">
                  <h3 className="text-lg font-semibold truncate">
                    {source}
                  </h3>
                  <span className="text-muted-foreground whitespace-nowrap">
                    ({totalItems.toLocaleString()})
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleExport(source, rows)}
                  className="h-8 w-8 flex-shrink-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      {headers.map(header => (
                        <TableHead key={header} className="px-2 py-2 text-xs border-r border-border/20 last:border-r-0">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={row.recordId}
                        className="hover:bg-muted/50"
                      >
                        {headers.map(header => (
                          <TableCell 
                            key={`${row.recordId}-${header}`} 
                            className="px-2 py-2 text-xs border-r border-border/20 last:border-r-0"
                          >
                            {row.values[header] || "-"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )
}