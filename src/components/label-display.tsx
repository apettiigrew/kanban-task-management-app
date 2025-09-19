'use client'

import { TLabelWithChecked } from '@/models/label'

interface LabelDisplayProps {
  labels: TLabelWithChecked[]
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + '...'
}

export function LabelDisplay({ labels }: LabelDisplayProps) {
  if (!labels || labels.length === 0) {
    return null
  }

  // Filter to only show labels that are checked (i.e., applied to this card)
  const checkedLabels = labels.filter(label => label.checked)

  if (checkedLabels.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1 mb-2">
      {checkedLabels.map((label) => (
        <div
          key={label.id}
          className="h-5 px-2 rounded text-white text-xs font-medium flex items-center"
          style={{ backgroundColor: label.color }}
        >
          {truncateText(label.title, 12)}
        </div>
      ))}
    </div>
  )
}
