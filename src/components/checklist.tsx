'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RenderIf } from '@/utils/render-if'
import { SquareCheck, Trash2, Plus, Square } from 'lucide-react'
import { useState } from 'react'

interface ChecklistProps {
  progress?: number
  onAddItem?: (item: string) => void
  onDelete?: () => void
  className?: string
}

export function Checklist(props: ChecklistProps) {
  const { progress = 10, onAddItem, onDelete, className } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [items, setItems] = useState<string[]>(['Item 1', 'Item 2', 'Item 3']);
  return (
    <div className={`flex flex-col justify-items-start p-1 gap-1 ${className || ''}`}>
      <div className="flex items-center gap-1">
        <SquareCheck className="flex-initial" />
        <p className="flex-auto">Checklist</p>
        <Trash2 className="h-4 w-4 flex-grow-0 flex-shrink-0 cursor-pointer" onClick={onDelete} />
      </div>
      <div className="flex items-center gap-2 w-full">
        <span className="text-sm font-medium text-muted-foreground">{progress}%</span>
        <div className="flex-1 bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <RenderIf condition={isAddingNewItem}>
          <div className="flex flex-col gap-2 w-full">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md">
                <Square className="h-4 w-4" />
                <p>{item}</p>
              </div>
            ))}
            <Input type="text" placeholder="Add a checklist item" className="flex-1 h-10 min-h-10 w-full" />
            <div className="flex items-start gap-2">
              <Button variant="outline" size="sm" className="flex-grow-0 flex-shrink-0">
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-grow-0 flex-shrink-0" onClick={() => setIsAddingNewItem(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </RenderIf>

        <RenderIf condition={!isAddingNewItem}>
          <div className="flex items-start gap-2">
            <Button variant="outline" size="sm" className="flex-grow-0 flex-shrink-0" onClick={() => setIsAddingNewItem(true)}>
              <Plus className="h-4 w-4" />
              <span>Add Items</span>
            </Button>
          </div>
        </RenderIf>
      </div>
    </div>
  )
} 