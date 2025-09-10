"use client"
import React, { useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface EntityBadgeProps {
  geneSymbol?: string;
  uniprotId?: string;
  entityType?: string | null;  // Entity type from database (protein, complex, mirna, etc.)
  maxChars?: number;    // Maximum characters before truncation
  maxWidth?: string;    // Maximum width (e.g., "w-32", "max-w-xs")
}

export const EntityBadge: React.FC<EntityBadgeProps> = ({ 
  geneSymbol, 
  uniprotId,
  entityType,
  maxChars = 12, // Default to 12 characters
  maxWidth = "max-w-[120px]", // Default max width
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = geneSymbol || '';
  const identifier = uniprotId || '';
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentQuery = searchParams.get('q') || '';
    const currentTab = searchParams.get('tab') || 'interactions';
    const currentSpecies = searchParams.get('species') || '9606';
    // Determine how to add the entity based on entity type
    const isProteinOrGene = !entityType || entityType.toLowerCase().includes('protein') || entityType.toLowerCase().includes('gene');
    
    let entityToAdd: string;
    if (isProteinOrGene) {
      // For proteins/genes, use normal search (no prefix)
      entityToAdd = name || identifier;
    } else {
      // For other entity types, use entity type prefix
      const prefix = entityType?.toLowerCase() || 'unknown';
      const value = name || identifier;
      entityToAdd = `${prefix}:${value}`;
    }
    
    // Parse existing queries and add the new entity
    const existingQueries = currentQuery
      .split(/[,;]/)
      .map(q => q.trim())
      .filter(q => q.length > 0);
    
    // Check if entity is already in the query
    const entityLower = entityToAdd.toLowerCase();
    const alreadyExists = existingQueries.some(q => q.toLowerCase() === entityLower);
    
    if (!alreadyExists) {
      existingQueries.push(entityToAdd);
    }
    
    // Create new search URL with comma after for autocomplete consistency
    const params = new URLSearchParams();
    params.set('q', existingQueries.join(', ') + ', ');
    params.set('tab', currentTab);
    params.set('species', currentSpecies);
    
    router.push(`/search?${params.toString()}`);
  };

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Check if text is truncated
  const isNameTruncated = name.length > maxChars;
  const isIdentifierTruncated = identifier.length > maxChars;
  
  const nameRef = useRef<HTMLSpanElement>(null);
  const identifierRef = useRef<HTMLSpanElement>(null);

  const content = (
    <div onClick={handleClick} className={`block relative ${maxWidth} cursor-pointer`}>
      <div 
        className="relative bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-md px-2 py-1 shadow-sm min-w-[80px] w-full transition-all duration-200 cursor-pointer hover:bg-gradient-to-br hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-800 hover:shadow-md hover:scale-105"
      >
        
        
        {/* Content */}
        <div className="flex flex-col items-center justify-center min-h-[32px]">
          {/* Primary display - gene symbol or canonical identifier */}
          <div className="h-[14px] flex items-center w-full">
            {isNameTruncated || (!(name) && identifier.length > maxChars) ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span 
                      ref={nameRef}
                      className="text-xs font-medium text-slate-900 dark:text-slate-100 w-full text-center leading-tight"
                    >
                      {truncateText(name || identifier, maxChars)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{name || identifier}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <span 
                ref={nameRef}
                className="text-xs font-medium text-slate-900 dark:text-slate-100 w-full text-center leading-tight"
              >
                {name || identifier}
              </span>
            )}
          </div>
          
          {/* Secondary line - canonical identifier only if we have a gene symbol */}
          <div className="h-[14px] flex items-center w-full">
            {name && (
              <>
                {isIdentifierTruncated ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span 
                          ref={identifierRef}
                          className="text-[10px] font-mono text-slate-500 dark:text-slate-400 w-full text-center leading-none"
                        >
                          {truncateText(identifier, maxChars)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{identifier}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span 
                    ref={identifierRef}
                    className="text-[10px] font-mono text-slate-500 dark:text-slate-400 w-full text-center leading-none"
                  >
                    {identifier}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return content;
};