"use client"
import React, { useRef, useState } from 'react';

interface EntityBadgeProps {
  displayName: string;
  canonicalIdentifier: string;
  geneSymbol?: string;  // Keep for backward compatibility
  uniprotId?: string;   // Keep for backward compatibility
}

export const EntityBadge: React.FC<EntityBadgeProps> = ({ 
  displayName, 
  canonicalIdentifier, 
  geneSymbol, 
  uniprotId,
}) => {
  // Use new props if provided, fallback to old props for backward compatibility
  const name = displayName || geneSymbol || '';
  const identifier = canonicalIdentifier || uniprotId || '';

  
  const nameRef = useRef<HTMLSpanElement>(null);
  const identifierRef = useRef<HTMLSpanElement>(null);

  const content = (
    <div className="relative">
      {/* Modern glass-morphism card */}
      <div className="relative bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-md px-2 py-1 shadow-sm min-w-[80px] w-full">
        
        
        {/* Content */}
        <div className="flex flex-col items-center justify-center min-h-[32px]">
          {/* Primary display - gene symbol or canonical identifier */}
          <div className="h-[14px] flex items-center w-full">
              <span 
                ref={nameRef}
                className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate w-full text-center leading-tight"
              >
                {name || identifier}
              </span>
          </div>
          
          {/* Secondary line - canonical identifier only if we have a gene symbol */}
          <div className="h-[14px] flex items-center w-full">
            {name && (
              <>

                  <span 
                    ref={identifierRef}
                    className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate w-full text-center leading-none"
                  >
                    {identifier}
                  </span>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );

  return content;
};