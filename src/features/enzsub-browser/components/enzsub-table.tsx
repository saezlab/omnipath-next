"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { exportToTSV } from "@/lib/utils/export"
import { Download } from "lucide-react"
import type React from "react"
import { EnzSubEntry } from "../types"

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
  const handleExport = () => {
    const data = currentResults.map(entry => ({
      'Enzyme': entry.enzyme || '',
      'Enzyme Gene Symbol': entry.enzymeGenesymbol || '',
      'Substrate': entry.substrate || '',
      'Substrate Gene Symbol': entry.substrateGenesymbol || '',
      'Modification': entry.modification || '',
      'Residue': formatResidue(entry.residueType, entry.residueOffset),
      'Isoforms': entry.isoforms || '',
      'Sources': entry.sources || '',
      'References': entry.references || '',
      'Curation Effort': entry.curationEffort?.toString() || '',
      'NCBI Tax ID': entry.ncbiTaxId?.toString() || '',
    }))
    exportToTSV(data, 'enzsub_relationships')
  }

  if (currentResults.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No enzyme-substrate relationships found matching the current filters.</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-hidden border border-primary/20 hover:border-primary/40 shadow-sm hover:shadow-md bg-background rounded-lg transition-all duration-200 flex flex-col">
        <div className="flex flex-row items-center justify-between space-y-0 p-4 bg-background flex-shrink-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">
              Enzyme-Substrate Relationships
            </h3>
            <span className="text-muted-foreground">
              ({currentResults.length.toLocaleString()})
            </span>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleExport}
            className="h-8 w-8"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Enzyme</TableHead>
                <TableHead>Substrate</TableHead>
                <TableHead>Modification</TableHead>
                <TableHead>Residue</TableHead>
                <TableHead>Sources</TableHead>
                <TableHead>Curation</TableHead>
                <TableHead>References</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentResults.map((entry) => {
                const role = getProteinRole(entry, searchedProteins)
                return (
                  <TableRow
                    key={entry.id}
                    className="hover:bg-muted/50"
                  >
                    <TableCell>
                      <RoleIndicator 
                        isEnzyme={role.isEnzyme} 
                        isSubstrate={role.isSubstrate} 
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className={`font-medium ${role.isEnzyme ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                          {entry.enzymeGenesymbol || entry.enzyme || "-"}
                        </div>
                        {entry.enzymeGenesymbol && entry.enzyme && (
                          <div className="text-xs text-muted-foreground">
                            {entry.enzyme}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className={`font-medium ${role.isSubstrate ? 'text-green-600 dark:text-green-400' : ''}`}>
                          {entry.substrateGenesymbol || entry.substrate || "-"}
                        </div>
                        {entry.substrateGenesymbol && entry.substrate && (
                          <div className="text-xs text-muted-foreground">
                            {entry.substrate}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.modification ? (
                        <Badge variant="outline" className="text-xs">
                          {entry.modification}
                        </Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {formatResidue(entry.residueType, entry.residueOffset)}
                    </TableCell>
                    <TableCell>
                      {entry.sources ? (
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {entry.sources.split(';').slice(0, 3).map((source, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {source.trim()}
                            </Badge>
                          ))}
                          {entry.sources.split(';').length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{entry.sources.split(';').length - 3} more
                            </span>
                          )}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <CurationEffortIndicator effort={entry.curationEffort} />
                    </TableCell>
                    <TableCell>
                      {entry.references ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {entry.references.split(';').slice(0, 2).map((ref, index) => (
                            <span key={index} className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded">
                              {ref.trim()}
                            </span>
                          ))}
                          {entry.references.split(';').length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{entry.references.split(';').length - 2} more
                            </span>
                          )}
                        </div>
                      ) : "-"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}