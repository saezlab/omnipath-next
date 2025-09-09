import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'

interface DebouncedSearchFilterProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  delay?: number
  className?: string
}

export function DebouncedSearchFilter({ 
  value, 
  onChange, 
  placeholder = "Search...",
  delay = 300,
  className 
}: DebouncedSearchFilterProps) {
  const [localValue, setLocalValue] = useState(value)
  const [isDebouncing, setIsDebouncing] = useState(false)
  
  useEffect(() => {
    setLocalValue(value)
  }, [value])
  
  useEffect(() => {
    if (localValue === value) {
      setIsDebouncing(false)
      return
    }
    
    setIsDebouncing(true)
    const timer = setTimeout(() => {
      onChange(localValue)
      setIsDebouncing(false)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [localValue, value, onChange, delay])
  
  return (
    <div className="relative">
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
      {isDebouncing && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      )}
    </div>
  )
}