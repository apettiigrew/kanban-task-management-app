"use client"

import { User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarHelpButtonProps {
  onClick?: () => void
  text?: string
}

export function SidebarHelpButton({ onClick, text = "Help" }: SidebarHelpButtonProps) {
  return (
    <Button 
      onClick={onClick}
      variant="outline" 
      className="w-full flex items-center justify-center gap-2"
    >
      <User className="h-4 w-4" />
      <span>{text}</span>
    </Button>
  )
}
