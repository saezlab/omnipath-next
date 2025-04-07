interface VisualizationPlaceholderProps {
  type: "network" | "chart"
}

export function VisualizationPlaceholder({ type }: VisualizationPlaceholderProps) {
  return (
    <div className="aspect-[16/9] rounded-lg border bg-muted flex items-center justify-center">
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

