"use client"

import { useState } from 'react';
import { MetaboSearchBar } from './metabo-search-bar';
import { PropertyFilters } from './property-filters';
import { CompoundResults } from './compound-results';
import { CompoundSearchResult } from '@/db/metabo/queries';
import { Card } from '@/components/ui/card';

export type SearchMode = 'text' | 'substructure' | 'similarity';

export interface SearchFilters {
  molecularWeightMin?: number;
  molecularWeightMax?: number;
  logpMin?: number;
  logpMax?: number;
  isDrug?: boolean;
  isLipid?: boolean;
  isMetabolite?: boolean;
  lipinskiCompliant?: boolean;
}

export function MetaboSearchInterface() {
  const [results, setResults] = useState<CompoundSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('text');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);

  const handleSearch = async (searchQuery: string, mode: SearchMode) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setQuery(searchQuery);
    setSearchMode(mode);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        mode,
        limit: '50',
      });

      if (mode === 'similarity') {
        params.set('threshold', similarityThreshold.toString());
      }

      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, value.toString());
        }
      });

      const response = await fetch(`/api/metabo/search?${params}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    // Re-run search if there's an active query
    if (query.trim()) {
      handleSearch(query, searchMode);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="p-6">
        <MetaboSearchBar
          onSearch={handleSearch}
          isSearching={isSearching}
          searchMode={searchMode}
          setSearchMode={setSearchMode}
          similarityThreshold={similarityThreshold}
          setSimilarityThreshold={setSimilarityThreshold}
        />
      </Card>

      {/* Filters and Results Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <PropertyFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <CompoundResults
            results={results}
            isLoading={isSearching}
            query={query}
            searchMode={searchMode}
          />
        </div>
      </div>
    </div>
  );
}