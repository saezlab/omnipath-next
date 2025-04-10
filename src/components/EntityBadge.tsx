import React, { useRef, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EntityBadgeProps {
  geneSymbol: string;
  uniprotId: string;
}

export const EntityBadge: React.FC<EntityBadgeProps> = ({ geneSymbol, uniprotId }) => {
  const geneSymbolRef = useRef<HTMLSpanElement>(null);
  const uniprotIdRef = useRef<HTMLSpanElement>(null);
  const [isGeneTruncated, setIsGeneTruncated] = useState(false);
  const [isUniprotTruncated, setIsUniprotTruncated] = useState(false);

  React.useEffect(() => {
    const checkTruncation = () => {
      if (geneSymbolRef.current) {
        setIsGeneTruncated(geneSymbolRef.current.scrollWidth > geneSymbolRef.current.clientWidth);
      }
      if (uniprotIdRef.current) {
        setIsUniprotTruncated(uniprotIdRef.current.scrollWidth > uniprotIdRef.current.clientWidth);
      }
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [geneSymbol, uniprotId]);

  const content = (
    <div className="relative w-[130px] h-[65px] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-100 dark:border-blue-800/50 shadow-sm"
        style={{
          clipPath: 'ellipse(50% 30% at 50% 50%)'
        }}
      />
      <div className="relative flex flex-col items-center justify-center w-full px-3 gap-0.5">
        <span 
          ref={geneSymbolRef}
          className="text-sm font-semibold text-blue-900 dark:text-blue-100 truncate w-full text-center -mb-0.5"
        >
          {geneSymbol}
        </span>
        <span 
          ref={uniprotIdRef}
          className="text-[10px] text-blue-600/70 dark:text-blue-300/70 font-mono truncate w-full text-center leading-none"
        >
          {uniprotId}
        </span>
      </div>
    </div>
  );

  if (isGeneTruncated || isUniprotTruncated) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm font-semibold">{geneSymbol}</p>
            <p className="text-xs text-muted-foreground font-mono">{uniprotId}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}; 