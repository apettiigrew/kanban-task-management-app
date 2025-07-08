"use client"

import { Loader2 } from "lucide-react"

interface RouteLoadingProps {
  message?: string
  className?: string
}

export function RouteLoading({ 
  message = "Loading...", 
  className = "" 
}: RouteLoadingProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

export function RouteLoadingInline({ 
  message = "Loading...", 
  className = "" 
}: RouteLoadingProps) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center space-y-2">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
