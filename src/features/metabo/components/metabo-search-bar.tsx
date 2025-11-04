"use client"

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { SearchMode } from './metabo-search-interface';
import { CompoundAutocomplete } from './compound-autocomplete';
import { validateSmiles, validateSmilesSync } from '../lib/smiles-validation';

interface MetaboSearchBarProps {
  onSearch: (query: string, mode: SearchMode, entityId?: string) => void;
  isSearching: boolean;
  searchMode: SearchMode;
  setSearchMode: (mode: SearchMode) => void;
  similarityThreshold: number;
  setSimilarityThreshold: (threshold: number) => void;
  query: string;
  onQueryChange: (value: string) => void;
}

export function MetaboSearchBar({
  onSearch,
  isSearching,
  searchMode,
  setSearchMode,
  similarityThreshold,
  setSimilarityThreshold,
  query,
  onQueryChange,
}: MetaboSearchBarProps) {
  const [smilesValidationError, setSmilesValidationError] = useState<string | null>(null);
  const [isValidatingSmiles, setIsValidatingSmiles] = useState(false);

  const handleSearch = useCallback(async (entityId?: string) => {
    if (!query.trim()) return;

    // For SMILES-based searches, validate first
    if ((searchMode === 'substructure' || searchMode === 'similarity') && !entityId) {
      const validation = await validateSmiles(query.trim());
      if (!validation.isValid) {
        setSmilesValidationError(validation.error || 'Invalid SMILES pattern');
        return;
      }
      setSmilesValidationError(null);
    }

    const trimmed = query.trim();
    onQueryChange(trimmed);
    onSearch(trimmed, searchMode, entityId);
  }, [query, searchMode, onQueryChange, onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // Real-time SMILES validation as user types
  useEffect(() => {
    if (searchMode === 'substructure' || searchMode === 'similarity') {
      if (!query.trim()) {
        setSmilesValidationError(null);
        return;
      }

      const timeoutId = setTimeout(async () => {
        setIsValidatingSmiles(true);
        try {
          // Try sync validation first for better performance
          const syncResult = validateSmilesSync(query.trim());
          if (syncResult) {
            setSmilesValidationError(syncResult.isValid ? null : syncResult.error || 'Invalid SMILES pattern');
          } else {
            // Fall back to async validation if OCL not loaded yet
            const validation = await validateSmiles(query.trim());
            setSmilesValidationError(validation.isValid ? null : validation.error || 'Invalid SMILES pattern');
          }
        } catch {
          setSmilesValidationError('Failed to validate SMILES pattern');
        } finally {
          setIsValidatingSmiles(false);
        }
      }, 500); // Debounce validation

      return () => clearTimeout(timeoutId);
    } else {
      setSmilesValidationError(null);
    }
  }, [query, searchMode]);

  const getPlaceholderText = () => {
    switch (searchMode) {
      case 'text':
        return 'Compound name, formula, or InChI key';
      case 'substructure':
        return 'SMILES substructure e.g. c1ccccc1';
      case 'similarity':
        return 'Reference SMILES e.g. CCO';
      default:
        return 'Search compounds...';
    }
  };

return (
  <div className="flex flex-col gap-3">
    <div className="rounded-lg border bg-background">
      <Tabs
        value={searchMode}
        onValueChange={(value) => setSearchMode(value as SearchMode)}
        className="w-full"
      >
        {/* One bar, consistent height, automatic dividers */}
        <div className="flex w-full flex-col items-stretch sm:flex-row divide-y divide-border/30 sm:divide-y-0 sm:divide-x">
          {/* Tabs */}
          <TabsList className="h-12 shrink-0 p-0 bg-muted/30 flex items-stretch rounded-tl-lg rounded-tr-lg sm:rounded-tl-lg sm:rounded-tr-none sm:rounded-bl-lg overflow-hidden">
            <TabsTrigger
              value="text"
              className="h-full rounded-none px-4 text-[0.7rem] font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              Text
            </TabsTrigger>
            <TabsTrigger
              value="substructure"
              className="h-full rounded-none px-4 text-[0.7rem] font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              Substructure
            </TabsTrigger>
            <TabsTrigger
              value="similarity"
              className="h-full rounded-none px-4 text-[0.7rem] font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              Similarity
            </TabsTrigger>
          </TabsList>

          {/* Input area */}
          <div className="relative flex h-12 flex-1 items-center gap-3 bg-background px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              {searchMode === 'text' ? (
                <CompoundAutocomplete
                  value={query}
                  onChange={onQueryChange}
                  onSelect={(value, entityId) => {
                    const sanitizedValue = value.trim();
                    onQueryChange(sanitizedValue);
                    onSearch(sanitizedValue, searchMode, entityId);
                  }}
                  placeholder={getPlaceholderText()}
                  onKeyDown={handleKeyDown}
                  className="h-10 bg-transparent px-0 text-sm text-foreground placeholder:text-muted-foreground/60 border-0 focus-visible:ring-0"
                  overlayClassName="left-0 right-0 top-[calc(100%+0.35rem)] z-50"
                />
              ) : (
                <Input
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={getPlaceholderText()}
                  className="h-10 border-0 bg-transparent px-0 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                />
              )}
            </div>
          </div>

          {/* Search button */}
          <Button
            onClick={() => handleSearch()}
            disabled={isSearching || !query.trim() || smilesValidationError !== null}
            className="rounded-r-lg h-12 shrink-0 px-6 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-primary/90 disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </Button>
        </div>
      </Tabs>
    </div>

    {smilesValidationError && (searchMode === 'substructure' || searchMode === 'similarity') && (
      <Alert variant="destructive" className="items-center rounded-md border-destructive/30 bg-destructive/10">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm text-destructive/90">
          {smilesValidationError}
        </AlertDescription>
      </Alert>
    )}

    {isValidatingSmiles && (searchMode === 'substructure' || searchMode === 'similarity') && (
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Validating SMILES pattern...
      </div>
    )}

    {searchMode === 'similarity' && (
      <div className="rounded-md border border-border/70 bg-background px-3 py-3">
        <div className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">
          Similarity threshold
        </div>
        <div className="mt-3">
          <Slider
            value={[similarityThreshold]}
            onValueChange={(values) => setSimilarityThreshold(values[0])}
            max={1.0}
            min={0.3}
            step={0.05}
            className="w-full"
            aria-label="Similarity threshold"
          />
        </div>
        <div className="mt-2 flex justify-between text-[0.7rem] text-muted-foreground/70">
          <span>0.3 (loose)</span>
          <span>1.0 (exact)</span>
        </div>
      </div>
    )}
  </div>
);}