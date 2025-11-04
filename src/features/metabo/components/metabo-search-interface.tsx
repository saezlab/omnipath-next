"use client"

import { useEffect, useRef, useState } from 'react';
import { MetaboSearchBar } from './metabo-search-bar';
import { CompoundResults } from './compound-results';
import { CompoundSearchResult } from '@/db/metabo/queries';
import { Card } from '@/components/ui/card';

export type SearchMode = 'text' | 'substructure' | 'similarity';

export function MetaboSearchInterface() {
  const [results, setResults] = useState<CompoundSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('text');
  const [queries, setQueries] = useState<Record<SearchMode, string>>({
    text: '',
    substructure: '',
    similarity: '',
  });
  const [activeSearch, setActiveSearch] = useState<{ mode: SearchMode; query: string }>({
    mode: 'text',
    query: '',
  });
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isBarVisible, setIsBarVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const lastScrollY = lastScrollYRef.current;
        const scrollDelta = currentScrollY - lastScrollY;

        if (currentScrollY < 80) {
          setIsBarVisible(true);
        } else if (scrollDelta > 6) {
          setIsBarVisible(false);
        } else if (scrollDelta < -6) {
          setIsBarVisible(true);
        }

        lastScrollYRef.current = currentScrollY;
        tickingRef.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const performSearch = async (searchQuery: string, mode: SearchMode, offset: number = 0, entityId?: string): Promise<CompoundSearchResult[]> => {
    const params = new URLSearchParams({
      q: searchQuery,
      mode,
      limit: '20',
      offset: offset.toString(),
    });

    // If we have an entityId from autocomplete selection, use fast path
    if (entityId) {
      params.set('entityId', entityId);
    }

    if (mode === 'similarity') {
      params.set('threshold', similarityThreshold.toString());
    }

    const response = await fetch(`/api/metabo/search?${params}`);
    if (!response.ok) {
      throw new Error('Search failed');
    }

    return await response.json();
  };

  const handleSearch = async (searchQuery: string, mode: SearchMode, entityId?: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    setIsSearching(true);
    setSearchMode(mode);
    setActiveSearch({ mode, query: trimmedQuery });
    setQueries(prev => ({ ...prev, [mode]: trimmedQuery }));
    setCurrentPage(0);

    try {
      const data = await performSearch(trimmedQuery, mode, 0, entityId);
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
    if (!activeSearch.query.trim() || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const offset = nextPage * 20;
      const newResults = await performSearch(activeSearch.query, activeSearch.mode, offset);

      setResults(prev => [...prev, ...newResults]);
      setCurrentPage(nextPage);
      setHasMore(newResults.length === 20); // If we got a full page, there might be more
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Search Bar */}
      <div
        className={`sticky top-4 z-40 transition-all duration-500 ease-out ${
          isBarVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
          <MetaboSearchBar
            onSearch={handleSearch}
            isSearching={isSearching}
            searchMode={searchMode}
            setSearchMode={setSearchMode}
            similarityThreshold={similarityThreshold}
            setSimilarityThreshold={setSimilarityThreshold}
            query={queries[searchMode]}
            onQueryChange={(value) =>
              setQueries(prev => ({ ...prev, [searchMode]: value }))
            }
          />
      </div>

      {/* Results */}
      <CompoundResults
        results={results}
        isLoading={isSearching}
        query={activeSearch.query}
        searchMode={activeSearch.mode}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}
