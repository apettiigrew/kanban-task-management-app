'use client'

import { memo, useMemo } from 'react'
import { TLabelWithChecked } from '@/models/label'
import { LabelPill } from './label-pill'
import { TagIcon } from 'lucide-react'

interface LabelListProps {
  labels: TLabelWithChecked[]
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showOnlyChecked?: boolean
}

export const LabelList = memo(function LabelList({
  labels,
  className = '',
  size = 'lg',
  showOnlyChecked = true
}: LabelListProps) {
  const filteredLabels = useMemo(() => {
    if (showOnlyChecked) {
      return labels.filter(label => label.checked)
    }
    return labels
  }, [labels, showOnlyChecked])

  const sortedLabels = useMemo(() => {
    return [...filteredLabels].sort((a, b) => {
      return a.title.localeCompare(b.title)
    })
  }, [filteredLabels])

  if (sortedLabels.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {sortedLabels.map((label) => (
        <LabelPill
          key={label.id}
          label={label}
          size={size}
        />
      ))}
    </div>
  )
})
