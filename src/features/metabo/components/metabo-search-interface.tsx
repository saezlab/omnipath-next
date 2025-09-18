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
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const performSearch = async (searchQuery: string, mode: SearchMode, offset: number = 0, canonicalId?: string): Promise<CompoundSearchResult[]> => {
    const params = new URLSearchParams({
      q: searchQuery,
      mode,
      limit: '20',
      offset: offset.toString(),
    });

    // If we have a canonicalId from autocomplete selection, use fast path
    if (canonicalId) {
      params.set('canonicalId', canonicalId);
    }

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

    return await response.json();
  };

  const handleSearch = async (searchQuery: string, mode: SearchMode, canonicalId?: string) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setQuery(searchQuery);
    setSearchMode(mode);
    setCurrentPage(0);

    try {
      const data = await performSearch(searchQuery, mode, 0, canonicalId);
      setResults(data);
      setHasMore(data.length === 20); // If we got a full page, there might be more
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setHasMore(false);
    } finally {
      setIsSearching(false);
    }
  };

  const loadMore = async () => {
    if (!query.trim() || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const offset = nextPage * 20;
      const newResults = await performSearch(query, searchMode, offset);

      setResults(prev => [...prev, ...newResults]);
      setCurrentPage(nextPage);
      setHasMore(newResults.length === 20); // If we got a full page, there might be more
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setIsLoadingMore(false);
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
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
          />
        </div>
      </div>
    </div>
  );
}