'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RenderIf } from '@/utils/render-if'
import { SquareCheck, Trash2, Plus, Square, Check } from 'lucide-react'
import { useState } from 'react'

interface ChecklistItem {
  id: string
  text: string
  isCompleted: boolean
}

interface ChecklistProps {
  title: string
  items?: ChecklistItem[]
  onAddItem?: (item: string) => void
  onDeleteItem?: (itemId: string) => void
  onToggleItem?: (itemId: string) => void
  onDelete?: () => void
  className?: string
}

export function Checklist(props: ChecklistProps) {
  const { 
    title,
    items = [], 
    onAddItem, 
    onDeleteItem,
    onToggleItem,
    onDelete, 
    className 
  } = props;
  
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  
  const completedItems = items.filter(item => item.isCompleted).length;
  const progress = items.length > 0 ? Math.round((completedItems / items.length) * 100) : 0;

  const handleAddItem = () => {
    const trimmedText = newItemText.trim();
    if (trimmedText && onAddItem) {
      onAddItem(trimmedText);
      setNewItemText('');
      setIsAddingItem(false);
    }
  };

  const handleCancelAdd = () => {
    setNewItemText('');
    setIsAddingItem(false);
  };

  const handleToggleItem = (itemId: string) => {
    if (onToggleItem) {
      onToggleItem(itemId);
    }
  };

  return (
    <div className={`flex flex-col justify-items-start p-3 gap-3 border rounded-lg bg-card ${className || ''}`}>
      <div className="flex items-center gap-2">
        <SquareCheck className="h-4 w-4 flex-shrink-0" />
        <p className="flex-1 font-medium">{title}</p>
        <Trash2 
          className="h-4 w-4 flex-shrink-0 cursor-pointer hover:text-destructive transition-colors" 
          onClick={onDelete} 
        />
      </div>
      
      <div className="flex items-center gap-2 w-full">
        <span className="text-sm font-medium text-muted-foreground">{progress}%</span>
        <div className="flex-1 bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div className="flex flex-col gap-2 w-full">
        {/* Render existing items */}
        {items.map((item) => (
          <div 
            key={item.id} 
            className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded-md group transition-colors"
          >
            <button
              onClick={() => handleToggleItem(item.id)}
              className="flex-shrink-0 transition-colors"
            >
              {item.isCompleted ? (
                <SquareCheck className="h-4 w-4 text-primary" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <p className={`flex-1 ${item.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {item.text}
            </p>
            <button
              onClick={() => onDeleteItem?.(item.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}

        {/* Add new item form */}
        <RenderIf condition={isAddingItem}>
          <div className="flex flex-col gap-2 w-full">
            <Input 
              type="text" 
              placeholder="Add a checklist item" 
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem();
                } else if (e.key === 'Escape') {
                  handleCancelAdd();
                }
              }}
              autoFocus
              className="w-full" 
            />
            <div className="flex items-start gap-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleAddItem}
                disabled={!newItemText.trim()}
                className="flex-shrink-0"
              >
                Add
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancelAdd}
                className="flex-shrink-0"
              >
                Cancel
              </Button>
            </div>
          </div>
        </RenderIf>

        {/* Add item button */}
        <RenderIf condition={!isAddingItem}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsAddingItem(true)}
            className="justify-start gap-2 w-fit"
          >
            <Plus className="h-4 w-4" />
            Add an item
          </Button>
        </RenderIf>
      </div>
    </div>
  )
} 