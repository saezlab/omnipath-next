interface VisualizationPlaceholderProps {
  type: "network" | "chart"
}

export function VisualizationPlaceholder({ type }: VisualizationPlaceholderProps) {
  return (
    <div className="aspect-[16/9] rounded-lg border border-primary/20 hover:border-primary/40 bg-muted flex items-center justify-center transition-all duration-200">
      <div className="text-center">
        <p className="text-muted-foreground">{type === "network" ? "Network visualization" : "Chart visualization"}</p>
        <p className="text-xs text-muted-foreground">
          {type === "network"
            ? "Select nodes to explore relationships"
            : "Distribution of interaction types and properties"}
        </p>
      </div>
    </div>
  )
}

