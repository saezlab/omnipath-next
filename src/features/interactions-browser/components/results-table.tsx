"use client"

import { EntityBadge } from "@/components/EntityBadge";
import { ColumnDef, ResultsTable } from "@/components/shared/results-table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SearchProteinNeighborsResponse } from "@/features/interactions-browser/api/queries";
import { cn } from "@/lib/utils";
import { ArrowRight, Atom, Dna, FlaskConical, Mic, Minus } from "lucide-react";
import React from 'react';

type InteractionData = SearchProteinNeighborsResponse['interactions'][number];
type InteractionDataWithCount = InteractionData & { referenceCount: number };

interface InteractionResultsTableProps {
  interactions: InteractionData[];
  onSelectInteraction: (interaction: InteractionData) => void;
  showSearch?: boolean;
  searchKeys?: string[];
  searchPlaceholder?: string;
  showExport?: boolean;
  resultsPerPage?: number;
  maxCellChars?: number;
}

const INTERACTION_TYPE_ICONS: Record<string, { icon: React.ReactNode; label: string }> = {
  post_translational: { icon: <Atom className="h-4 w-4" />, label: "Post-translational" },
  transcriptional: { icon: <Dna className="h-4 w-4" />, label: "Transcriptional" },
  post_transcriptional: { icon: <Dna className="h-4 w-4" />, label: "Post-transcriptional" },
  mirna_transcriptional: { icon: <Mic className="h-4 w-4" />, label: "miRNA Transcriptional" },
  small_molecule_protein: { icon: <FlaskConical className="h-4 w-4" />, label: "Small Molecule-Protein" },
}

const getInteractionColor = (interaction: InteractionData) => {
  let color = "text-grey-500";
  if (interaction.isInhibition || interaction.isStimulation) color = "text-orange-500";
  if (interaction.consensusStimulation) color = "text-green-500";
  if (interaction.consensusInhibition) color = "text-red-500";
  return color;
}

const getInteractionTypeIcon = (type: string | null) => {
  if (!type) return { icon: <Atom className="h-4 w-4" />, label: "Unknown" }
  return INTERACTION_TYPE_ICONS[type] || { icon: <Atom className="h-4 w-4" />, label: type }
}

const getReferenceCount = (interaction: InteractionData): number => {
  return interaction.references ? interaction.references.split(";").length : 0;
};

export function InteractionResultsTable({ 
  interactions, 
  onSelectInteraction,
  showSearch,
  searchKeys,
  searchPlaceholder,
  showExport,
  resultsPerPage,
  maxCellChars = 50,
}: InteractionResultsTableProps) {
  const columns: ColumnDef<InteractionDataWithCount>[] = [
    {
      accessorKey: 'interaction',
      header: 'Interaction',
      headerClassName: 'text-center',
      cell: ({ row }) => {
        const typeIcon = getInteractionTypeIcon(row.type);
        return (
          <div className="flex items-center justify-center gap-4">
            <EntityBadge
              geneSymbol={row.sourceGenesymbol || ''}
              uniprotId={row.source || ''}
            />

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-muted-foreground">
                      {typeIcon.icon}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{typeIcon.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className={cn("flex items-center", getInteractionColor(row))}>
                {row.isDirected ? (
                  <ArrowRight className="h-6 w-6" />
                ) : (
                  <Minus className="h-6 w-6" />
                )}
              </div>
            </div>

            <EntityBadge
              geneSymbol={row.targetGenesymbol || ''}
              uniprotId={row.target || ''}
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'sources',
      header: 'Sources',
      headerClassName: 'hidden lg:table-cell',
      cellClassName: 'hidden lg:table-cell max-w-[200px]',
      cell: ({ row }) => {
        const sources = row.sources || [];
        if (sources.length === 0) return <span className="text-muted-foreground">-</span>;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-wrap gap-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {sources.slice(0, 3).map((source, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs flex-shrink-0">
                      {source}
                    </Badge>
                  ))}
                  {sources.length > 3 && (
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      +{sources.length - 3} more
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent
                className="max-w-[300px] p-3 bg-popover border shadow-lg"
                side="top"
                align="start"
              >
                <div className="flex flex-wrap gap-1">
                  {sources.map((source, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {source}
                    </Badge>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: 'referenceCount',
      header: 'References',
      headerClassName: 'hidden lg:table-cell',
      cellClassName: 'hidden lg:table-cell text-center',
      enableSorting: true,
      cell: ({ row }) => row.referenceCount,
    },
  ];

  const dataWithReferenceCount = React.useMemo(() => 
      interactions.map(interaction => ({ ...interaction, referenceCount: getReferenceCount(interaction) }))
  , [interactions]);

  return (
    <ResultsTable<InteractionDataWithCount>
        columns={columns}
        data={dataWithReferenceCount}
        onRowClick={onSelectInteraction}
        initialSortKey="referenceCount"
        initialSortDirection="desc"
        bodyRowClassName="cursor-pointer hover:bg-muted/50"
        maxHeight=""
        scrollAreaClassName="border-t"
        showSearch={showSearch}
        searchKeys={searchKeys}
        searchPlaceholder={searchPlaceholder}
        showExport={showExport}
        resultsPerPage={resultsPerPage}
        maxCellChars={maxCellChars}
    />
  )
}

