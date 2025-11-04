"use client"

import { useState, useEffect, useCallback, useRef, useDeferredValue, type KeyboardEvent } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface CompoundAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string, entityId?: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  overlayClassName?: string;
}

interface AutocompleteResult {
  label: string;
  value: string;
  type: string;
  entityId: string;
}

/** Simple debounce hook for primitives/strings */
function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function CompoundAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  onKeyDown,
  overlayClassName,
}: CompoundAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Keep list open only if opened by typing (not by focus)
  const openedByTypingRef = useRef(false);

  // Debounced query used for fetching
  const debouncedQuery = useDebouncedValue(value, 250);

  // Defer rendering of a potentially heavy list so typing stays responsive
  const deferredSuggestions = useDeferredValue(suggestions);

  // Abort in-flight request when a new one starts or on unmount
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/metabo/autocomplete?q=${encodeURIComponent(query)}&limit=10`,
        { signal: controller.signal }
      );

      if (res.ok) {
        const data: AutocompleteResult[] = await res.json();
        setSuggestions(data);

        // Keep it open if it was opened by typing and query is still valid
        if (openedByTypingRef.current && query.length >= 2) {
          setShowSuggestions(true);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Autocomplete error:', err);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch only when the *debounced* query changes
  useEffect(() => {
    if (!openedByTypingRef.current && debouncedQuery.length >= 2) {
      // user didn't open via typing; don't auto-open
      return;
    }
    fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, fetchSuggestions]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handleSelect = (suggestion: AutocompleteResult) => {
    openedByTypingRef.current = false;
    onChange(suggestion.value);
    onSelect(suggestion.value, suggestion.entityId);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next);
          // Only open when typing and query is long enough
          openedByTypingRef.current = true;
          setShowSuggestions(next.length >= 2);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            openedByTypingRef.current = false;
            setShowSuggestions(false);
          }
          onKeyDown?.(e);
        }}
        placeholder={placeholder}
        className={cn(className, "outline-none focus:outline-none focus:ring-0 border-0 w-full")}
        onFocus={() => {
          /* no auto-open on focus */
        }}
        onBlur={() => {
          // Close when leaving (allow click in panel)
          window.setTimeout(() => {
            openedByTypingRef.current = false;
            setShowSuggestions(false);
          }, 150);
        }}
      />

      {showSuggestions && (
        <div
          className={cn(
            'absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-border/50 bg-card/95 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.4)] backdrop-blur-sm transition-all',
            overlayClassName,
          )}
          // Avoid input blur while interacting with the panel
          onMouseDown={(e) => e.preventDefault()}
        >
          <Command className="rounded-none border-0 bg-transparent">
            <CommandList className="max-h-[240px] px-1 py-1">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground/80">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Fetching suggestions...</span>
                </div>
              ) : deferredSuggestions.length > 0 ? (
                <CommandGroup className="space-y-1">
                  {deferredSuggestions.map((suggestion, index) => (
                    <CommandItem
                      key={`${suggestion.value}-${index}`}
                      value={suggestion.value}
                      onSelect={() => handleSelect(suggestion)}
                      className="cursor-pointer rounded-xl px-2 py-1.5 text-sm transition-colors hover:bg-muted/60 focus:bg-muted/60"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium leading-none text-foreground">{suggestion.label}</span>
                        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground/75">
                          {suggestion.type}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : debouncedQuery.length >= 2 ? (
                <CommandEmpty className="py-6 text-muted-foreground/80">
                  No suggestions found
                </CommandEmpty>
              ) : null}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}