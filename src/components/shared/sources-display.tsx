import { Badge } from "@/components/ui/badge"

interface SourcesDisplayProps {
  sources: string | null
  className?: string
  maxVisible?: number
  inline?: boolean
}

export function SourcesDisplay({ 
  sources, 
  className,
  maxVisible,
  inline = false
}: SourcesDisplayProps) {
  if (!sources) {
    return inline ? (
      <span className="text-muted-foreground text-xs">No sources</span>
    ) : (
      <div className="text-sm text-muted-foreground">No sources available</div>
    )
  }

  const sourceList = sources.split(';').map(s => s.trim()).filter(Boolean)
  
  if (inline && maxVisible !== undefined) {
    return (
      <div className={`flex flex-wrap gap-1 ${className || ''}`}>
        {sourceList.slice(0, maxVisible).map((source, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {source}
          </Badge>
        ))}
        {sourceList.length > maxVisible && (
          <span className="text-xs text-muted-foreground">
            +{sourceList.length - maxVisible} more
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      {!inline && (
        <h4 className="text-sm font-semibold text-foreground mb-3">Sources</h4>
      )}
      <div className="flex flex-wrap gap-2">
        {sourceList.map((source, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {source}
          </Badge>
        ))}
      </div>
    </div>
  )
}