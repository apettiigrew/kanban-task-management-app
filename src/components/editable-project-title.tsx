'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { useUpdateProjectTitle } from '@/hooks/mutations/use-project-mutations'
import { toast } from 'sonner'

interface EditableProjectTitleProps {
  projectId: string
  title: string
  className?: string
  placeholder?: string
  maxLength?: number
}

export const EditableProjectTitle = ({
  projectId,
  title,
  className = '',
  placeholder = 'Enter project title',
  maxLength = 100
}: EditableProjectTitleProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(title)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)

  const updateProjectMutation = useUpdateProjectTitle({
    onSuccess: () => {
      toast.success('Project title updated successfully')
      setIsEditing(false)
      setIsLoading(false)
    },
    onError: (error) => {
      console.error('Failed to update project title:', error)
      toast.error('Failed to update project title')
      setIsLoading(false)
      // Revert to original title on error
      setEditValue(title)
    }
  })

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Update editValue when title prop changes
  useEffect(() => {
    setEditValue(title)
  }, [title])

  const handleClick = () => {
    if (!isLoading) {
      setIsEditing(true)
    }
  }

  const handleBlur = async () => {
    if (isLoading) return

    const trimmedValue = editValue.trim()
    
    // Don't save if empty or unchanged
    if (!trimmedValue || trimmedValue === title) {
      setEditValue(title)
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    
    try {
      await updateProjectMutation.mutateAsync({
        id: projectId,
        data: { title: trimmedValue }
      })
    } catch (error) {
      // Error handling is done in the mutation callbacks
      console.error('Error updating project title:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleBlur()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditValue(title)
      setIsEditing(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= maxLength) {
      setEditValue(value)
    }
  }

  // Calculate dynamic width based on text content
  const getInputWidth = () => {
    if (!measureRef.current) return 'auto'
    const text = editValue || placeholder
    measureRef.current.textContent = text
    const width = measureRef.current.offsetWidth
    return `${Math.max(width + 20, 100)}px` // Add padding and minimum width
  }

  if (isEditing) {
    return (
      <>
        <Input
          ref={inputRef}
          value={editValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={isLoading}
          className={`inline-block ${className}`}
          style={{ 
            width: getInputWidth(),
            fontSize: 'inherit',
            fontWeight: 'inherit',
            lineHeight: 'inherit'
          }}
          data-testid="editable-project-title-input"
        />
        {/* Hidden span for measuring text width */}
        <span
          ref={measureRef}
          className={`absolute opacity-0 pointer-events-none whitespace-nowrap ${className}`}
          style={{ 
            fontSize: 'inherit',
            fontWeight: 'inherit',
            lineHeight: 'inherit'
          }}
        />
      </>
    )
  }

  return (
    <span
      onClick={handleClick}
      className={`cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors ${className}`}
      title="Click to edit project title"
      data-testid="editable-project-title-display"
    >
      {title}
    </span>
  )
}
