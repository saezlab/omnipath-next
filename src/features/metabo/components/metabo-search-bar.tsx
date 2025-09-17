"use client"

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2 } from 'lucide-react';
import { SearchMode } from './metabo-search-interface';
import { CompoundAutocomplete } from './compound-autocomplete';

interface MetaboSearchBarProps {
  onSearch: (query: string, mode: SearchMode) => void;
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

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query.trim(), searchMode);
    }
  }, [query, searchMode, onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

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
              onSelect={(value) => {
                setQuery(value);
                onSearch(value, searchMode);
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
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
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