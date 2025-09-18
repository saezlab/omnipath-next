"use client"

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { SearchMode } from './metabo-search-interface';
import { CompoundAutocomplete } from './compound-autocomplete';
import { validateSmiles, validateSmilesSync } from '../lib/smiles-validation';

interface MetaboSearchBarProps {
  onSearch: (query: string, mode: SearchMode, canonicalId?: string) => void;
  isSearching: boolean;
  searchMode: SearchMode;
  setSearchMode: (mode: SearchMode) => void;
  similarityThreshold: number;
  setSimilarityThreshold: (threshold: number) => void;
}

export function MetaboSearchBar({
  onSearch,
  isSearching,
  searchMode,
  setSearchMode,
  similarityThreshold,
  setSimilarityThreshold,
}: MetaboSearchBarProps) {
  const [query, setQuery] = useState('');
  const [smilesValidationError, setSmilesValidationError] = useState<string | null>(null);
  const [isValidatingSmiles, setIsValidatingSmiles] = useState(false);

  const handleSearch = useCallback(async (canonicalId?: string) => {
    if (!query.trim()) return;

    // For SMILES-based searches, validate first
    if ((searchMode === 'substructure' || searchMode === 'similarity') && !canonicalId) {
      const validation = await validateSmiles(query.trim());
      if (!validation.isValid) {
        setSmilesValidationError(validation.error || 'Invalid SMILES pattern');
        return;
      }
      setSmilesValidationError(null);
    }

    onSearch(query.trim(), searchMode, canonicalId);
  }, [query, searchMode, onSearch]);

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
        } catch (error) {
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
        return 'Search by compound name, InChI key, or formula...';
      case 'substructure':
        return 'Enter valid SMILES pattern (e.g., c1ccccc1, CCO, CC(=O)O)...';
      case 'similarity':
        return 'Enter reference SMILES structure (e.g., CCO, c1ccccc1)...';
      default:
        return 'Search compounds...';
    }
  };

  const getHelpText = () => {
    switch (searchMode) {
      case 'text':
        return 'Search by compound names, identifiers, molecular formulas, or InChI keys';
      case 'substructure':
        return 'Find compounds containing the specified substructure pattern. Use valid SMILES notation (e.g., c1ccccc1 for benzene, CCO for ethanol)';
      case 'similarity':
        return 'Find compounds similar to the reference structure. Enter a valid SMILES string';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Mode Tabs */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Search Mode</Label>
        <Tabs value={searchMode} onValueChange={(value) => setSearchMode(value as SearchMode)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">Text Search</TabsTrigger>
            <TabsTrigger value="substructure">Substructure</TabsTrigger>
            <TabsTrigger value="similarity">Similarity</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-sm text-muted-foreground mt-1">{getHelpText()}</p>
      </div>

      {/* Search Input */}
      <div className="space-y-3">
        <div className="flex gap-2">
          {searchMode === 'text' ? (
            <CompoundAutocomplete
              value={query}
              onChange={setQuery}
              onSelect={(value, canonicalId) => {
                setQuery(value);
                onSearch(value, searchMode, canonicalId);
              }}
              placeholder={getPlaceholderText()}
              className="flex-1"
            />
          ) : (
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholderText()}
              className="flex-1"
            />
          )}
          <Button
            onClick={() => handleSearch()}
            disabled={isSearching || !query.trim() || smilesValidationError !== null}
            className="px-6"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* SMILES Validation Error */}
        {smilesValidationError && (searchMode === 'substructure' || searchMode === 'similarity') && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {smilesValidationError}
            </AlertDescription>
          </Alert>
        )}

        {/* SMILES Validation Loading */}
        {isValidatingSmiles && (searchMode === 'substructure' || searchMode === 'similarity') && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Validating SMILES pattern...
          </div>
        )}

        {/* Similarity Threshold Slider */}
        {searchMode === 'similarity' && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Similarity Threshold: {similarityThreshold.toFixed(2)}
            </Label>
            <Slider
              value={[similarityThreshold]}
              onValueChange={(values) => setSimilarityThreshold(values[0])}
              max={1.0}
              min={0.3}
              step={0.05}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.3 (loose)</span>
              <span>1.0 (exact)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}