'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { X, TagIcon, ArrowLeft, Check, Pencil } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useState } from 'react'

export type TLabel = {
  id: string
  title: string
  color: string
  checked: boolean
}

interface CreateNewLabelProps {
  onBack: () => void
  onClose: () => void
  onCreate: (label: TLabel) => void
}

interface AddLabelButtonProps {
  onAddLabel?: (label: TLabel) => void
  onSelectLabel?: (label: TLabel) => void
  onDeselectLabel?: (labelId: string) => void
  selectedLabels?: TLabel[]
  existingLabels?: TLabel[]
  disabled?: boolean
  children?: React.ReactNode
}

const LABEL_COLORS = [
  '#61BD4F', '#F2D600', '#FF9F1A', '#EB5A46', '#C377E0',
  '#0079BF', '#00C2E0', '#51E898', '#FF78CB', '#344563',
  '#B04632', '#89609E', '#CD5A91', '#4BBF6B', '#00AECC',
  '#838C91', '#D29034', '#B3B3B3', '#FF6B6B', '#4ECDC4',
  '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
]

interface DisplayLabelsProps {
  labels: TLabel[]
  searchQuery: string
  onSearchChange: (query: string) => void
  onLabelToggle: (label: TLabel) => void
  onShowCreateLabel: () => void
  onClose: () => void
}


const defaultLabels: TLabel[] = [

]

export function AddLabelButton({
  onAddLabel,
  onSelectLabel,
  onDeselectLabel,
  disabled = false,
  children = "Labels"
}: AddLabelButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateLabel, setShowCreateLabel] = useState(false)
  const [localLabels, setLocalLabels] = useState<TLabel[]>(defaultLabels)

  const handleClose = () => {
    setIsOpen(false)
    setShowCreateLabel(false)
  }

  const handleShowCreateLabel = () => {
    setShowCreateLabel(true)
  }

  const handleBackToLabels = () => {
    setShowCreateLabel(false)
  }

  const handleCreateLabel = (newLabel: TLabel) => {
    setLocalLabels(prev => [...prev, newLabel])
    onAddLabel?.(newLabel)
    onSelectLabel?.(newLabel)
    setShowCreateLabel(false)
  }


  const handleLabelToggle = (cLabel: TLabel) => {
    console.log('label', cLabel)
    localLabels.map(label => {
      if (label.id === cLabel.id) {
        label.checked = !label.checked
      }
    })
    setLocalLabels([...localLabels])
  }

  const filteredLabels = localLabels.filter(label =>
    label.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="w-full justify-start gap-2 hover:bg-accent hover:text-accent-foreground"
        >
          <TagIcon className="h-4 w-4" />
          {children}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-4" align="start">
        {!showCreateLabel ? (
          <DisplayLabels
            labels={filteredLabels}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onLabelToggle={handleLabelToggle}
            onShowCreateLabel={handleShowCreateLabel}
            onClose={handleClose}
          />
        ) : (
          <CreateNewLabel
            onBack={handleBackToLabels}
            onClose={handleClose}
            onCreate={handleCreateLabel}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


function DisplayLabels({
  labels,
  searchQuery,
  onSearchChange,
  onLabelToggle,
  onShowCreateLabel,
  onClose
}: DisplayLabelsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Labels</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Input
        placeholder="Search labels..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full"
      />

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Labels</h4>

        {labels.length > 0 && (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                <Checkbox
                  checked={label.checked}
                  onCheckedChange={() => onLabelToggle(label)}
                  className="w-4 h-4"
                />
                <div
                  className="h-6 px-2 rounded text-white text-xs font-medium flex items-center flex-1 cursor-pointer"
                  style={{ backgroundColor: label.color }}
                  onClick={() => onLabelToggle(label)}>
                  {label.title}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    // TODO: Implement edit functionality
                    console.log('Edit label:', label.id)
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start h-10 text-left font-normal"
          onClick={onShowCreateLabel}
        >
          Create a new label
        </Button>
      </div>
    </div>
  )
}

function CreateNewLabel({ onBack, onClose, onCreate }: CreateNewLabelProps) {
  const [labelTitle, setLabelTitle] = useState('')
  const [selectedColor, setSelectedColor] = useState('#61BD4F')

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
  }

  const handleRemoveColor = () => {
    setSelectedColor('')
  }

  const handleCreate = () => {
    if (labelTitle.trim() && selectedColor) {
      const newLabel: TLabel = {
        id: Math.random().toString(36).substr(2, 9),
        title: labelTitle.trim(),
        color: selectedColor,
        checked: true
      }
      onCreate(newLabel)
      setLabelTitle('')
      setSelectedColor('#61BD4F')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">Create label</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {selectedColor && (
        <div
          className="h-8 w-full rounded flex items-center px-2 text-white text-sm font-medium"
          style={{ backgroundColor: selectedColor }}
        >
          {labelTitle}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Title</label>
        <Input
          placeholder="Enter label title..."
          value={labelTitle}
          onChange={(e) => setLabelTitle(e.target.value)}
          className="w-full"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Select a color</label>
        <div className="grid grid-cols-5 gap-1">
          {LABEL_COLORS.map((color) => (
            <button
              key={color}
              className={`h-6 w-12 rounded border-2 ${selectedColor === color
                  ? 'border-blue-500'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color)}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemoveColor}
          className="flex-1"
          disabled={!selectedColor}
        >
          <X className="h-4 w-4 mr-1" />
          Remove color
        </Button>
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={!labelTitle.trim() || !selectedColor}
          className="flex-1"
        >
          Create
        </Button>
      </div>
    </div>
  )
}
