"use client"

import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { searchIdentifiers, SearchIdentifiersResponse } from "@/db/queries"
import { useState, useCallback, useRef, forwardRef } from "react"

function getCurrentQuerySegment(fullQuery: string, cursorPosition?: number): {
  currentSegment: string
  beforeCurrentSegment: string
  afterCurrentSegment: string
  segmentStartIndex: number
  segmentEndIndex: number
} {
  // If no cursor position provided, use the last segment (backward compatibility)
  if (cursorPosition === undefined) {
    const lastCommaIndex = fullQuery.lastIndexOf(',')
    const lastSemicolonIndex = fullQuery.lastIndexOf(';')
    const lastSeparatorIndex = Math.max(lastCommaIndex, lastSemicolonIndex)
    
    if (lastSeparatorIndex === -1) {
      return {
        currentSegment: fullQuery.trim(),
        beforeCurrentSegment: '',
        afterCurrentSegment: '',
        segmentStartIndex: 0,
        segmentEndIndex: fullQuery.length
      }
    }
    
    const afterLastComma = fullQuery.substring(lastSeparatorIndex + 1)
    return {
      currentSegment: afterLastComma.trim(),
      beforeCurrentSegment: fullQuery.substring(0, lastSeparatorIndex + 1),
      afterCurrentSegment: '',
      segmentStartIndex: lastSeparatorIndex + 1,
      segmentEndIndex: fullQuery.length
    }
  }

  // Find all separator positions
  const separators: number[] = []
  for (let i = 0; i < fullQuery.length; i++) {
    if (fullQuery[i] === ',' || fullQuery[i] === ';') {
      separators.push(i)
    }
  }

  // Find which segment contains the cursor
  let segmentStart = 0
  let segmentEnd = fullQuery.length

  for (const separatorPos of separators) {
    if (cursorPosition <= separatorPos) {
      segmentEnd = separatorPos
      break
    }
    segmentStart = separatorPos + 1
  }

  const currentSegment = fullQuery.substring(segmentStart, segmentEnd).trim()
  const beforeCurrentSegment = fullQuery.substring(0, segmentStart)
  const afterCurrentSegment = fullQuery.substring(segmentEnd)

  return {
    currentSegment,
    beforeCurrentSegment,
    afterCurrentSegment,
    segmentStartIndex: segmentStart,
    segmentEndIndex: segmentEnd
  }
}

interface AutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
  selectedSpecies?: string
  disabled?: boolean
}

export const AutocompleteInput = forwardRef<HTMLInputElement, AutocompleteInputProps>(
  ({ value, onChange, onKeyDown, placeholder, className, selectedSpecies = "9606", disabled }, ref) => {
    const [suggestions, setSuggestions] = useState<SearchIdentifiersResponse>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
    const [cursorPosition, setCursorPosition] = useState<number>(0)
    const inputRef = useRef<HTMLInputElement>(null)

    // Debounced suggestion fetching
    const debouncedFetchSuggestions = useCallback(
      (() => {
        let timeoutId: NodeJS.Timeout
        return (searchTerm: string) => {
          clearTimeout(timeoutId)
          timeoutId = setTimeout(async () => {
            if (searchTerm.length < 2) {
              setSuggestions([])
              setShowSuggestions(false)
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
            } catch (error) {
              console.error("Error fetching suggestions:", error)
              setSuggestions([])
              setShowSuggestions(false)
            }
            setIsFetchingSuggestions(false)
          }, 300)
        }
      })(),
      [selectedSpecies]
    )

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      const newCursorPosition = e.target.selectionStart || 0
      
      onChange(newValue)
      setCursorPosition(newCursorPosition)
      setSelectedSuggestionIndex(-1)
      
      const { currentSegment } = getCurrentQuerySegment(newValue, newCursorPosition)
      debouncedFetchSuggestions(currentSegment)
    }, [onChange, debouncedFetchSuggestions])

    const handleInputClick = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
      const input = e.target as HTMLInputElement
      const newCursorPosition = input.selectionStart || 0
      setCursorPosition(newCursorPosition)
      
      // Trigger suggestions for the segment at cursor position
      const { currentSegment } = getCurrentQuerySegment(input.value, newCursorPosition)
      if (currentSegment.length >= 2) {
        debouncedFetchSuggestions(currentSegment)
      }
    }, [debouncedFetchSuggestions])

    const handleInputKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      // Update cursor position on arrow key navigation
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
        const input = e.target as HTMLInputElement
        const newCursorPosition = input.selectionStart || 0
        setCursorPosition(newCursorPosition)
        
        // Trigger suggestions for the segment at cursor position
        const { currentSegment } = getCurrentQuerySegment(input.value, newCursorPosition)
        if (currentSegment.length >= 2) {
          debouncedFetchSuggestions(currentSegment)
        }
      }
    }, [debouncedFetchSuggestions])

    const handleSuggestionSelect = useCallback((suggestion: SearchIdentifiersResponse[0]) => {
      const { beforeCurrentSegment, afterCurrentSegment, segmentStartIndex } = 
        getCurrentQuerySegment(value, cursorPosition)
      
      // Replace the current segment with the suggestion
      const newValue = beforeCurrentSegment + suggestion.identifierValue + afterCurrentSegment
      
      onChange(newValue)
      setShowSuggestions(false)
      setSuggestions([])
      setSelectedSuggestionIndex(-1)
      
      // Set cursor position after the inserted suggestion
      const newCursorPosition = segmentStartIndex + suggestion.identifierValue.length
      setCursorPosition(newCursorPosition)
      
      // Update the actual input cursor position after the state update
      setTimeout(() => {
        const currentInput = inputRef.current || (ref as React.RefObject<HTMLInputElement>)?.current
        if (currentInput) {
          currentInput.setSelectionRange(newCursorPosition, newCursorPosition)
        }
      }, 0)
    }, [value, cursorPosition, onChange, ref])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || suggestions.length === 0) {
        onKeyDown?.(e)
        return
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedSuggestionIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          )
          break
        case "Enter":
          e.preventDefault()
          if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
            handleSuggestionSelect(suggestions[selectedSuggestionIndex])
          } else {
            onKeyDown?.(e)
          }
          break
        case "Escape":
          e.preventDefault()
          setShowSuggestions(false)
          setSelectedSuggestionIndex(-1)
          break
        default:
          onKeyDown?.(e)
      }
    }, [showSuggestions, suggestions, selectedSuggestionIndex, handleSuggestionSelect, onKeyDown])

    return (
      <Popover open={showSuggestions && suggestions.length > 0} onOpenChange={setShowSuggestions}>
        <PopoverTrigger asChild>
          <Input
            ref={ref || inputRef}
            type="search"
            placeholder={placeholder}
            className={className}
            value={value}
            onChange={handleInputChange}
            onClick={handleInputClick}
            onKeyDown={handleKeyDown}
            onKeyUp={handleInputKeyUp}
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
                      className={`cursor-pointer px-3 py-2 hover:bg-muted hover:text-foreground dark:hover:bg-secondary dark:hover:text-secondary-foreground transition-colors ${
                        index === selectedSuggestionIndex 
                          ? 'bg-muted text-foreground dark:bg-secondary dark:text-secondary-foreground' 
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