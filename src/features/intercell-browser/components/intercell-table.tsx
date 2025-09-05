"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { exportToTSV } from "@/lib/utils/export"
import { Download } from "lucide-react"
import { IntercellEntry } from "@/features/intercell-browser/types"

interface IntercellTableProps {
  entries: IntercellEntry[]
}

export function IntercellTable({ entries }: IntercellTableProps) {
  const handleExport = () => {
    const data = entries.map(entry => ({
      'Gene Symbol': entry.genesymbol || '',
      'UniProt ID': entry.uniprot || '',
      'Category': entry.category || '',
      'Parent': entry.parent || '',
      'Database': entry.database || '',
      'Scope': entry.scope || '',
      'Aspect': entry.aspect || '',
      'Source': entry.source || '',
      'Entity Type': entry.entityType || '',
      'Consensus Score': entry.consensusScore?.toString() || '',
      'Transmitter': entry.transmitter ? 'Yes' : 'No',
      'Receiver': entry.receiver ? 'Yes' : 'No',
      'Secreted': entry.secreted ? 'Yes' : 'No',
      'Plasma Membrane Transmembrane': entry.plasmaMembraneTransmembrane ? 'Yes' : 'No',
      'Plasma Membrane Peripheral': entry.plasmaMembranePeripheral ? 'Yes' : 'No',
    }));
    exportToTSV(data, 'intercell_data');
  };


  const getCategoryColor = (category: string | null) => {
    if (!category) return "bg-gray-100 text-gray-800";
    if (category.toLowerCase().includes("receptor")) return "bg-blue-100 text-blue-800";
    if (category.toLowerCase().includes("ligand")) return "bg-green-100 text-green-800";
    if (category.toLowerCase().includes("enzyme")) return "bg-purple-100 text-purple-800";
    if (category.toLowerCase().includes("transporter")) return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };

  if (entries.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No intercell data found matching the current filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {entries.length} intercell entries
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
                <TableHead>Gene Symbol</TableHead>
                <TableHead>UniProt ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Database</TableHead>
                <TableHead>Aspect</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Causality</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {entry.genesymbol || "-"}
                  </TableCell>
                  <TableCell>{entry.uniprot || "-"}</TableCell>
                  <TableCell>
                    {entry.category ? (
                      <Badge variant="secondary" className={getCategoryColor(entry.category)}>
                        {entry.category}
                      </Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.database || "-"}</Badge>
                  </TableCell>
                  <TableCell>
                    {entry.aspect ? (
                      <Badge variant="outline" className={
                        entry.aspect === "functional" ? "bg-green-50 text-green-700" : 
                        entry.aspect === "locational" ? "bg-blue-50 text-blue-700" : 
                        ""
                      }>
                        {entry.aspect}
                      </Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell>{entry.scope || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {entry.transmitter && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                          Transmitter
                        </Badge>
                      )}
                      {entry.receiver && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                          Receiver
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {entry.secreted && (
                        <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 text-xs">
                          Secreted
                        </Badge>
                      )}
                      {entry.plasmaMembraneTransmembrane && (
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 text-xs">
                          Transmembrane
                        </Badge>
                      )}
                      {entry.plasmaMembranePeripheral && (
                        <Badge variant="secondary" className="bg-pink-100 text-pink-800 text-xs">
                          Peripheral
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.consensusScore !== null ? entry.consensusScore : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}