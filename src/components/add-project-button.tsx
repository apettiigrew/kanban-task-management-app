"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AddProjectButtonProps {
  onClick?: () => void
  className?: string
}

export function AddProjectButton({ onClick, className }: AddProjectButtonProps) {
  return (
    <div className="p-4">
      <Button 
        onClick={onClick}
        className={`w-full bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-2 ${className || ''}`} 
        size="sm"
      >
        <Plus className="h-4 w-4" />
        Add project
      </Button>
    </div>
  )
}
