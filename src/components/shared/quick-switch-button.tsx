"use client"

import { useRouter } from "next/navigation"
import { Network, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuickSwitchButtonProps {
  currentView: "interactions" | "annotations"
  entityName?: string
}

export function QuickSwitchButton({ currentView, entityName }: QuickSwitchButtonProps) {
  const router = useRouter()

  if (!entityName) return null

  const handleSwitch = () => {
    const targetPath = currentView === "interactions" ? "/annotations" : "/interactions"
    router.push(`${targetPath}?q=${encodeURIComponent(entityName)}`)
  }

  return (
    <div className="fixed bottom-6 right-6">
      <Button size="lg" className="rounded-full shadow-lg" onClick={handleSwitch}>
        {currentView === "interactions" ? (
          <>
            <Tag className="mr-2 h-4 w-4" />
            View Annotations
          </>
        ) : (
          <>
            <Network className="mr-2 h-4 w-4" />
            View Interactions
          </>
        )}
      </Button>
    </div>
  )
}

