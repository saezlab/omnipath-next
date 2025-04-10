import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EntityBadgeProps {
  geneSymbol: string;
  uniprotId: string;
}

export const EntityBadge: React.FC<EntityBadgeProps> = ({ geneSymbol, uniprotId }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative w-[120px] h-7 flex items-center justify-center py-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-100 shadow-sm" />
            <div className="relative flex flex-col items-center justify-center w-full px-3 gap-0.5">
              <span className="text-sm font-medium text-blue-900 truncate w-full text-center -mb-0.5">
                {geneSymbol}
              </span>
              <span className="text-[10px] text-blue-600/70 font-mono truncate w-full text-center leading-none">
                {uniprotId}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm font-medium">{geneSymbol}</p>
          <p className="text-xs text-muted-foreground font-mono">{uniprotId}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 