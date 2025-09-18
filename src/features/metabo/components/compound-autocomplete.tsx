"use client"

import { useState, useEffect, useCallback } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface CompoundAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string, canonicalId?: string) => void;
  placeholder?: string;
  className?: string;
}

interface AutocompleteResult {
  label: string;
  value: string;
  type: string;
  compoundId: string;
  canonicalId: string;
}

export function CompoundAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
}: CompoundAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/metabo/autocomplete?q=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, fetchSuggestions]);

  const handleSelect = (suggestion: AutocompleteResult) => {
    onChange(suggestion.value);
    onSelect(suggestion.value, suggestion.canonicalId);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onBlur={() => {
          // Delay hiding to allow clicks on suggestions
          setTimeout(() => setShowSuggestions(false), 150);
        }}
      />

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg">
          <Command>
            <CommandList className="max-h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent mr-2"></div>
                  Loading suggestions...
                </div>
              ) : suggestions.length > 0 ? (
                <CommandGroup>
                  {suggestions.map((suggestion, index) => (
                    <CommandItem
                      key={`${suggestion.value}-${index}`}
                      value={suggestion.value}
                      onSelect={() => handleSelect(suggestion)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{suggestion.label}</span>
                        <span className="text-xs text-muted-foreground">{suggestion.type}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : value.length >= 2 ? (
                <CommandEmpty>No suggestions found.</CommandEmpty>
              ) : null}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}