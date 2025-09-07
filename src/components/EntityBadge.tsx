"use client"
import React, { useRef } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface EntityBadgeProps {
  geneSymbol?: string;  // Keep for backward compatibility
  uniprotId?: string;   // Keep for backward compatibility
  onClick?: () => void;
  maxChars?: number;    // Maximum characters before truncation
  maxWidth?: string;    // Maximum width (e.g., "w-32", "max-w-xs")
}

export const EntityBadge: React.FC<EntityBadgeProps> = ({ 
  geneSymbol, 
  uniprotId,
  onClick,
  maxChars = 12, // Default to 12 characters
  maxWidth = "max-w-[120px]", // Default max width
}) => {
  // Use new props if provided, fallback to old props for backward compatibility
  const name = geneSymbol || '';
  const identifier = uniprotId || '';

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
    <div className={`relative ${maxWidth}`}>
      {/* Modern glass-morphism card */}
      <div 
        className={`relative bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-md px-2 py-1 shadow-sm min-w-[80px] w-full transition-all duration-200 ${
          onClick ? 'cursor-pointer hover:bg-gradient-to-br hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-800 hover:shadow-md hover:scale-105' : ''
        }`}
        onClick={onClick}>
        
        
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