'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus } from 'lucide-react'
import { useState } from 'react'

interface AddChecklistButtonProps {
  onAddChecklist: (title: string) => void
  disabled?: boolean
  children?: React.ReactNode
}

export function AddChecklistButton({ onAddChecklist, disabled = false, children = "Add Checklist" }: AddChecklistButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('Checklist')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle = title.trim()
    
    if (!trimmedTitle) {
      return // Prevent submission with empty title
    }
    
    onAddChecklist(trimmedTitle)
    setTitle('Checklist') // Reset to default
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTitle('Checklist') // Reset to default
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="w-full justify-start gap-2 hover:bg-accent hover:text-accent-foreground"
        >
          <Plus className="h-4 w-4" />
          {children}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-4" align="start">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="checklist-title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="checklist-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Checklist"
              autoFocus
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="primary"
              type="submit" 
              size="sm"
              disabled={!title.trim()}
              className="flex-1"
            >
              Add
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 