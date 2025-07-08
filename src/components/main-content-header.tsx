"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MainContentHeaderProps {
  title?: string
  subtitle?: string
  onNewProject?: () => void
  className?: string
}

export function MainContentHeader({ 
  title = "All Projects",
  subtitle = "Manage and track your projects",
  onNewProject,
  className = ""
}: MainContentHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-6 w-full ${className}`}>
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      <Button 
        onClick={onNewProject}
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        New Project
      </Button>
    </div>
  )
}
