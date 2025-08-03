'use client'

import { SquareCheck } from 'lucide-react'
import { useMemo } from 'react'

interface ChecklistProgressIndicatorProps {
  completed: number
  total: number
  showIcon?: boolean
  className?: string
}

export function ChecklistProgressIndicator(props: ChecklistProgressIndicatorProps) {
  const { completed, total, className = '' } = props
  const isCompleted =  useMemo(() => completed === total && total > 0, [completed, total])

  if(total === 0) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 w-full border-1 border-gray-200 rounded-md p-1 ${className} ${isCompleted ? 'bg-green-200 text-green-600' : 'text-muted-foreground'}`}>
      <SquareCheck className={`h-4 w-4 flex-shrink-0`} />
      <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
        {completed}/{total}
      </span>
    </div>
  )
} 