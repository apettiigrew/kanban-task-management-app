'use client'

import { SquareCheck } from 'lucide-react'

interface ChecklistProgressIndicatorProps {
  completed: number
  total: number
  showIcon?: boolean
  className?: string
}

export function ChecklistProgressIndicator(props: ChecklistProgressIndicatorProps) {
  const { completed, total, showIcon = true, className = '' } = props
  
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  const isCompleted = completed === total && total > 0
  
  return (
    <div className={`flex items-center gap-2 w-full ${className}`}>
      {showIcon && (
        <SquareCheck className={`h-4 w-4 flex-shrink-0 ${isCompleted ? 'text-green-600' : 'text-primary'}`} />
      )}
      <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
        {completed}/{total} ({progress}%)
      </span>
      <div className={`flex-1 rounded-full h-2 ${isCompleted ? 'bg-green-100' : 'bg-muted'}`}>
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${isCompleted ? 'bg-green-600' : 'bg-primary'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
} 