'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useCreateLabel, useToggleCardLabel } from '@/hooks/mutations/use-label-mutations'
import { useLabelsWithCheckedStatus } from '@/hooks/queries/use-labels'
import { TLabelWithChecked } from '@/models/label'
import { LABEL_COLORS } from '@/utils/data'
import { ArrowLeft, Pencil, TagIcon, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + '...'
}

interface AddLabelButtonProps {
  projectId: string
  cardId: string
  disabled?: boolean
  children?: React.ReactNode
}
export function AddLabelButton({
  projectId,
  cardId,
  disabled = false,
  children = "Labels"
}: AddLabelButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateLabel, setShowCreateLabel] = useState(false)

  const {
    data: labelsWithChecked = [],
    isLoading: isLoadingLabelsWithChecked,
    error: labelsWithCheckedError
  } = useLabelsWithCheckedStatus(cardId)
  
  const createLabelMutation = useCreateLabel()
  const toggleCardLabelMutation = useToggleCardLabel()

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setShowCreateLabel(false)
  }, [])

  const handleShowCreateLabel = useCallback(() => {
    setShowCreateLabel(true)
  }, [])

  const handleBackToLabels = useCallback(() => {
    setShowCreateLabel(false)
  }, [])

  const handleCreateLabel = useCallback((labelData: { title: string; color: string }) => {
    createLabelMutation.mutate({
      cardId: cardId,
      projectId: projectId,
      title: labelData.title,
      color: labelData.color,
    }, {
      onSuccess: (newLabel) => {
        setShowCreateLabel(false)
      }
    })
  }, [createLabelMutation])

  const handleLabelToggle = useCallback((label: TLabelWithChecked) => {
    toggleCardLabelMutation.mutate({
      cardId: cardId,
      labelId: label.id
    })
  }, [toggleCardLabelMutation, cardId])

  const filteredLabels = useMemo(() => labelsWithChecked.filter(label =>
    label.title.toLowerCase().includes(searchQuery.toLowerCase())
  ), [labelsWithChecked, searchQuery])

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="w-full justify-start gap-2 hover:bg-accent hover:text-accent-foreground">
          <TagIcon className="h-4 w-4" />
          {children}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-4 max-h-[500px] overflow-hidden" align="start">
        {!showCreateLabel ? (
          <DisplayLabels
            labels={filteredLabels}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onLabelToggle={handleLabelToggle}
            onShowCreateLabel={handleShowCreateLabel}
            onClose={handleClose}
            isLoading={isLoadingLabelsWithChecked}
            error={labelsWithCheckedError}
          />
        ) : (
          <CreateNewLabel
            onBack={handleBackToLabels}
            onClose={handleClose}
            onCreate={handleCreateLabel}
            isCreating={createLabelMutation.isPending}
            error={createLabelMutation.error}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


interface DisplayLabelsProps {
  labels: TLabelWithChecked[]
  searchQuery: string
  onSearchChange: (query: string) => void
  onLabelToggle: (label: TLabelWithChecked) => void
  onShowCreateLabel: () => void
  onClose: () => void
  isLoading?: boolean
  error?: Error | null
}
function DisplayLabels({
  labels,
  searchQuery,
  onSearchChange,
  onLabelToggle,
  onShowCreateLabel,
  onClose,
  isLoading = false,
  error,
}: DisplayLabelsProps) {
  const labelsContainerClassName = useMemo(() => {
    const baseClasses = 'space-y-1 overflow-y-auto scrollbar-thin scrollbar-gray-300'

    const heightClass = 'max-h-48'
  
    const borderClass = labels.length >= 10
      ? 'border border-gray-200 rounded-md p-1'
      : ''

    return `${baseClasses} ${heightClass} ${borderClass}`
  }, [labels.length])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Labels</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 hover:bg-gray-100">
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
        {!isLoading && !error && labels.length > 0 && (
          <div className="relative">
            <div className={labelsContainerClassName}>
              {labels.map((label) => {

                return (
                  <LabelItem
                    key={label.id}
                    label={label}
                    onLabelToggle={onLabelToggle}
                  />
                )
              })}
            </div>
            {labels.length >= 10 && (
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
            )}
          </div>
        )}

        {!isLoading && !error && labels.length === 0 && (
          <div className="flex items-center justify-center py-4">
            <div className="text-sm text-gray-500">No labels found</div>
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start h-10 text-left font-normal"
          onClick={onShowCreateLabel}
          disabled={isLoading}
        >
          Create a new label
        </Button>
      </div>
    </div>
  )
}

interface CreateNewLabelProps {
  onBack: () => void
  onClose: () => void
  onCreate: (labelData: { title: string; color: string }) => void
  isCreating?: boolean
  error?: Error | null
}
function CreateNewLabel({ onBack, onClose, onCreate, isCreating = false, error }: CreateNewLabelProps) {
  const [labelTitle, setLabelTitle] = useState('')
  const [selectedColor, setSelectedColor] = useState('#61BD4F')

  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color)
  }, [])

  const handleRemoveColor = useCallback(() => {
    setSelectedColor('')
  }, [])

  const handleCreate = useCallback(() => {
    if (labelTitle.trim() && selectedColor && !isCreating) {
      onCreate({
        title: labelTitle.trim(),
        color: selectedColor
      })
      setLabelTitle('')
      setSelectedColor('#61BD4F')
    }
  }, [labelTitle, selectedColor, isCreating, onCreate])

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
          {truncateText(labelTitle, 35)}
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
          disabled={isCreating}
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
              disabled={isCreating}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500">
          Error creating label: {error.message}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemoveColor}
          className="flex-1"
          disabled={!selectedColor || isCreating}
        >
          <X className="h-4 w-4 mr-1" />
          Remove color
        </Button>
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={!labelTitle.trim() || !selectedColor || isCreating}
          className="flex-1">
         Create
        </Button>
      </div>
    </div>
  )
}

interface LabelItemProps {
  label: TLabelWithChecked
  onLabelToggle: (label: TLabelWithChecked) => void
}

function LabelItem({ label, onLabelToggle }: LabelItemProps) {
  return (
    <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
      <Checkbox
        checked={label.checked}
        onCheckedChange={() => onLabelToggle(label)}
        className="w-4 h-4"
      />
      <div
        className="h-6 px-2 rounded text-white text-xs font-medium flex items-center flex-1 cursor-pointer"
        style={{ backgroundColor: label.color }}
        onClick={() => onLabelToggle(label)}>
        {truncateText(label.title, 27)}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-gray-200"
        onClick={(e) => {
          e.stopPropagation()
        }}>
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  )
}
