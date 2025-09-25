"use client"

import { Badge } from "@/components/ui/badge"
import { ColumnDef, ResultsTable } from "@/components/shared/results-table"
import { IntercellEntry } from "@/features/intercell-browser/types"
import { EntityBadge } from "@/components/EntityBadge"

interface IntercellTableProps {
  entries: IntercellEntry[]
}

const getCategoryColor = (category: string | null) => {
  if (!category) return "bg-gray-100 text-gray-800";
  if (category.toLowerCase().includes("receptor")) return "bg-blue-100 text-blue-800";
  if (category.toLowerCase().includes("ligand")) return "bg-green-100 text-green-800";
  if (category.toLowerCase().includes("enzyme")) return "bg-purple-100 text-purple-800";
  if (category.toLowerCase().includes("transporter")) return "bg-orange-100 text-orange-800";
  return "bg-gray-100 text-gray-800";
};

export function IntercellTable({ entries }: IntercellTableProps) {
  const columns: ColumnDef<IntercellEntry>[] = [
    {
      accessorKey: 'protein',
      header: 'Protein',
      cell: ({ row }) => (
        <EntityBadge
          geneSymbol={row.genesymbol || ""}
          uniprotId={row.uniprot || ""}
        />
      ),
    },
    {
      accessorKey: 'parent',
      header: 'Parent',
      cell: ({ row }) => row.parent ? (
        <Badge variant="outline" className="bg-slate-50 text-slate-700">
          {row.parent}
        </Badge>
      ) : "-",
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => row.category ? (
        <Badge variant="secondary" className={getCategoryColor(row.category)}>
          {row.category}
        </Badge>
      ) : "-",
    },
    {
      accessorKey: 'aspect',
      header: 'Aspect',
      cell: ({ row }) => row.aspect ? (
        <Badge variant="outline" className={
          row.aspect === "functional" ? "bg-green-50 text-green-700" :
          row.aspect === "locational" ? "bg-blue-50 text-blue-700" :
          ""
        }>
          {row.aspect}
        </Badge>
      ) : "-",
    },
    {
      accessorKey: 'scope',
      header: 'Scope',
      cell: ({ row }) => row.scope || "-",
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap">
          {row.secreted && (
            <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 text-xs">
              Secreted
            </Badge>
          )}
          {row.plasmaMembraneTransmembrane && (
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 text-xs">
              Transmembrane
            </Badge>
          )}
          {row.plasmaMembranePeripheral && (
            <Badge variant="secondary" className="bg-pink-100 text-pink-800 text-xs">
              Peripheral
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'causality',
      header: 'Causality',
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.transmitter && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
              Transmitter
            </Badge>
          )}
          {row.receiver && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
              Receiver
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'consensusScore',
      header: 'Score',
      cell: ({ row }) => row.consensusScore !== null ? row.consensusScore : "-",
    },
    {
      accessorKey: 'database',
      header: 'Database',
      cell: ({ row }) => (
        <Badge variant="outline">{row.database || "-"}</Badge>
      ),
    },
  ];

  if (entries.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No intercell data found matching the current filters.</p>
      </div>
    );
  }

  return (
    <ResultsTable<IntercellEntry>
      columns={columns}
      data={entries}
      title="Intercell Data"
      titleCount={entries.length}
      showExport={true}
      exportFilenamePrefix="intercell_data"
      infiniteScroll={true}
      resultsPerPage={30}
      maxHeight="h-full"
    />
  );
}