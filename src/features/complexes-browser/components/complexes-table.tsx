"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { exportToTSV } from "@/lib/utils/export"
import { Download, ChevronDown, ChevronRight } from "lucide-react"
import { ComplexEntry, ParsedComplex } from "@/features/complexes-browser/types"
import { useState } from "react"

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

export function ComplexesTable({ entries }: ComplexesTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  
  const parsedEntries = entries.map(parseComplexData)
  
  const handleExport = () => {
    const data = parsedEntries.map(entry => ({
      'Complex Name': entry.name || '',
      'Components (UniProt)': entry.components || '',
      'Components (Gene Symbols)': entry.componentsGenesymbols || '',
      'Stoichiometry': entry.stoichiometry || '',
      'Sources': entry.sources || '',
      'References': entry.references || '',
      'Identifiers': entry.identifiers || '',
      'Component Count': entry.componentCount.toString(),
    }))
    exportToTSV(data, 'complexes_data')
  }
  
  const toggleRowExpansion = (id: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }
  
  const formatStoichiometry = (stoichiometry: string | null) => {
    if (!stoichiometry) return null
    // Parse stoichiometry like "2:1:1" or other formats
    const parts = stoichiometry.split(/[;,:]/).map(s => s.trim()).filter(Boolean)
    return parts.map((part, index) => (
      <Badge key={index} variant="outline" className="text-xs">
        {part}
      </Badge>
    ))
  }

  if (entries.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No complexes found matching the current filters.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {entries.length} complexes
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExport}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export TSV
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[600px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Complex Name</TableHead>
                <TableHead>Components</TableHead>
                <TableHead>Stoichiometry</TableHead>
                <TableHead>Sources</TableHead>
                <TableHead>Component Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedEntries.map((entry) => {
                const isExpanded = expandedRows.has(entry.id)
                return (
                  <React.Fragment key={entry.id}>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleRowExpansion(entry.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.name || <span className="text-muted-foreground">Unnamed complex</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap max-w-md">
                          {entry.parsedGeneSymbols.slice(0, 5).map((gene, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {gene}
                            </Badge>
                          ))}
                          {entry.parsedGeneSymbols.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{entry.parsedGeneSymbols.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {formatStoichiometry(entry.stoichiometry) || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap max-w-xs">
                          {entry.parsedSources.slice(0, 2).map((source, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {source}
                            </Badge>
                          ))}
                          {entry.parsedSources.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{entry.parsedSources.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{entry.componentCount}</Badge>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-2">All Components (Gene Symbols)</h4>
                              <div className="flex gap-1 flex-wrap">
                                {entry.parsedGeneSymbols.map((gene, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {gene}
                                  </Badge>
                                ))}
                                {entry.parsedGeneSymbols.length === 0 && (
                                  <span className="text-sm text-muted-foreground">No gene symbols available</span>
                                )}
                              </div>
                            </div>
                            
                            {entry.components && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2">UniProt Accessions</h4>
                                <div className="flex gap-1 flex-wrap">
                                  {entry.parsedComponents.map((comp, index) => (
                                    <Badge key={index} variant="outline" className="text-xs font-mono">
                                      {comp}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {entry.references && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2">References</h4>
                                <p className="text-sm text-muted-foreground">{entry.references}</p>
                              </div>
                            )}
                            
                            {entry.identifiers && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2">External Identifiers</h4>
                                <p className="text-sm text-muted-foreground font-mono">{entry.identifiers}</p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}