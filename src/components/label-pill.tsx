'use client'

import { memo } from 'react'
import { TLabel } from '@/models/label'
import { cn } from '@/lib/utils'

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + '...'
}

interface LabelPillProps {
    label: TLabel
    className?: string
    size?: 'sm' | 'md' | 'lg'
    truncateLength?: number
}

const sizeClasses = {
    sm: 'h-4 px-1.5 text-xs',
    md: 'h-6 px-2 text-xs',
    lg: 'h-8 px-3 text-sm'
}

export const LabelPill = memo(function LabelPill({
    label,
    className = '',
    size = 'lg',
    truncateLength
}: LabelPillProps) {

    const displayText = truncateLength ? truncateText(label.title, truncateLength) : label.title

    const cname = cn(
        'inline-flex items-center rounded font-medium text-white cursor-pointer',
        'transition-opacity duration-200 hover:opacity-80',
        sizeClasses[size],
        className
    )
    return (
        <div
            className={cname}
            style={{ backgroundColor: label.color }}
            role="button"
            tabIndex={0}
            aria-label={`Label: ${label.title}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                }
            }}
        >
            {displayText}
        </div>
    )
})
