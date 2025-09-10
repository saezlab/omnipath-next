"use client"

import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { searchIdentifiers, SearchIdentifiersResponse } from "@/db/queries"
import { useState, useCallback, useRef, forwardRef, useEffect } from "react"

interface AutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onSearch?: (query: string) => void
  placeholder?: string
  className?: string
  selectedSpecies?: string
  disabled?: boolean
}

export const AutocompleteInput = forwardRef<HTMLInputElement, AutocompleteInputProps>(
  ({ value, onChange, onKeyDown, onSearch, placeholder, className, selectedSpecies = "9606", disabled }, ref) => {
    // Parse the comma-separated value into selected items and current input
    const parseValue = useCallback((val: string) => {
      if (!val.trim()) return { selectedItems: [], currentInput: '' }
      
      // Split by comma and trim each part
      const parts = val.split(',').map(s => s.trim())
      
      // If value ends with comma or semicolon (after trimming), all non-empty parts are selected
      if (val.trim().endsWith(',') || val.trim().endsWith(';')) {
        const selectedItems = parts.filter(Boolean) // Remove empty strings
        return { selectedItems, currentInput: '' }
      } else {
        // Last part is current input, rest are selected
        const allParts = parts.filter(Boolean)
        if (allParts.length === 0) {
          return { selectedItems: [], currentInput: '' }
        }
        return { 
          selectedItems: allParts.slice(0, -1), 
          currentInput: allParts[allParts.length - 1] || '' 
        }
      }
    }, [])

    const { selectedItems, currentInput } = parseValue(value)
    const [suggestions, setSuggestions] = useState<SearchIdentifiersResponse>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Debounced suggestion fetching
    const debouncedFetchSuggestions = useCallback(
      (() => {
        return (searchTerm: string) => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(async () => {
            if (searchTerm.length < 2) {
              setSuggestions([])
              setShowSuggestions(false)
              setSelectedSuggestionIndex(-1)
              return
            }

            setIsFetchingSuggestions(true)
            try {
              const results = await searchIdentifiers(searchTerm, 20, selectedSpecies)
              
              // Deduplicate suggestions by identifier value, keeping the first occurrence
              const seen = new Set<string>()
              const deduplicatedResults = results.filter(result => {
                const key = result.identifierValue.toLowerCase()
                if (seen.has(key)) {
                  return false
                }
                seen.add(key)
                return true
              }).slice(0, 10) // Limit to 10 after deduplication
              
              setSuggestions(deduplicatedResults)
              setShowSuggestions(true)
              setSelectedSuggestionIndex(deduplicatedResults.length > 0 ? 0 : -1)
            } catch (error) {
              console.error("Error fetching suggestions:", error)
              setSuggestions([])
              setShowSuggestions(false)
              setSelectedSuggestionIndex(-1)
            }
            setIsFetchingSuggestions(false)
          }, 300)
        }
      })(),
      [selectedSpecies]
    )

    // Fetch suggestions when current input changes
    useEffect(() => {
      // Only show suggestions if there's meaningful input (2+ characters and not just whitespace)
      if (currentInput.trim().length >= 2) {
        debouncedFetchSuggestions(currentInput.trim())
      } else {
        setSuggestions([])
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
      }
    }, [currentInput, debouncedFetchSuggestions])

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      onChange(newValue)
      setSelectedSuggestionIndex(-1)
    }, [onChange])

    const handleSuggestionSelect = useCallback((suggestion: SearchIdentifiersResponse[0]) => {
      // Replace the current input part with the selected suggestion and add comma
      const baseValue = selectedItems.length > 0 ? selectedItems.join(', ') + ', ' : ''
      const newValue = baseValue + suggestion.identifierValue + ', '
      
      onChange(newValue)
      setShowSuggestions(false)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setSuggestions([])
      setSelectedSuggestionIndex(-1)
      
      // Trigger search immediately after adding the selection
      if (onSearch) {
        onSearch(newValue.trim())
      }
      
      // Focus the input immediately
      const currentInput = inputRef.current || (ref as React.RefObject<HTMLInputElement>)?.current
      if (currentInput) {
        currentInput.focus()
      }
    }, [selectedItems, onChange, onSearch, ref])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (showSuggestions && suggestions.length > 0) {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault()
            setSelectedSuggestionIndex(prev => 
              prev < suggestions.length - 1 ? prev + 1 : 0
            )
            return
          case "ArrowUp":
            e.preventDefault()
            setSelectedSuggestionIndex(prev => 
              prev > 0 ? prev - 1 : suggestions.length - 1
            )
            return
          case "Escape":
            e.preventDefault()
            setShowSuggestions(false)
            setSelectedSuggestionIndex(-1)
            return
        }
      }
      
      if (e.key === "Enter") {
        // If there are suggestions and one is selected, use it
        if (showSuggestions && suggestions.length > 0 && selectedSuggestionIndex >= 0) {
          e.preventDefault()
          handleSuggestionSelect(suggestions[selectedSuggestionIndex])
          return
        } else if (currentInput.trim()) {
          // No suggestions but there's current input, add it as selected
          e.preventDefault()
          const baseValue = selectedItems.length > 0 ? selectedItems.join(', ') + ', ' : ''
          const newValue = baseValue + currentInput.trim() + ', '
          
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          onChange(newValue)
          
          // Trigger search immediately after adding the selection
          if (onSearch) {
            onSearch(newValue.trim())
          }
          return
        }
      } else if (e.key === "Backspace" && currentInput === '' && selectedItems.length > 0) {
        // If backspace is pressed and current input is empty, remove last selected item
        e.preventDefault()
        const newSelectedItems = selectedItems.slice(0, -1)
        const newValue = newSelectedItems.length > 0 ? newSelectedItems.join(', ') + ', ' : ''
        
        onChange(newValue)
        
        // Trigger search with updated selection
        if (onSearch) {
          onSearch(newValue.trim())
        }
        return
      }
      
      onKeyDown?.(e)
    }, [showSuggestions, suggestions, selectedSuggestionIndex, handleSuggestionSelect, currentInput, selectedItems, onChange, onKeyDown])

    return (
      <Popover open={showSuggestions && suggestions.length > 0} onOpenChange={setShowSuggestions}>
        <PopoverTrigger asChild>
          <input
            ref={ref || inputRef}
            type="search"
            placeholder={placeholder}
            className={`file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive ${className}`}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // Close suggestions after a small delay to allow for clicks
              setTimeout(() => setShowSuggestions(false), 150)
            }}
            disabled={disabled}
          />
        </PopoverTrigger>
          
          <PopoverContent 
            className="w-[400px] p-0 bg-popover border-border shadow-lg" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command className="bg-popover">
              <CommandList className="max-h-[300px]">
                {isFetchingSuggestions ? (
                  <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent mr-2"></div>
                    Loading suggestions...
                  </div>
                ) : suggestions.length > 0 ? (
                  <CommandGroup>
                    {suggestions.map((suggestion, index) => (
                      <CommandItem
                        key={`${suggestion.uniprotAccession}-${suggestion.identifierValue}-${index}`}
                        value={suggestion.identifierValue}
                        onSelect={() => handleSuggestionSelect(suggestion)}
                        className={`cursor-pointer px-3 py-2 transition-colors ${
                          index === selectedSuggestionIndex 
                            ? 'bg-accent text-accent-foreground dark:bg-secondary dark:text-secondary-foreground' 
                            : 'text-popover-foreground'
                        }`}
                      >
                        <div className="flex flex-col w-full">
                          <span className="font-medium text-foreground leading-tight">
                            {suggestion.identifierValue}
                          </span>
                          <span className="text-xs text-muted-foreground leading-tight mt-0.5">
                            {suggestion.identifierType} • {suggestion.uniprotAccession}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : (
                  <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                    No suggestions found.
                  </CommandEmpty>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
    )
  }
)

AutocompleteInput.displayName = "AutocompleteInput"