"use client"

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContentWithoutClose,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Separator } from '@/components/ui/separator'
import { useUpdateTask } from '@/hooks/mutations/use-task-mutations'
import { 
  useCreateChecklist, 
  useCreateChecklistItem, 
  useUpdateChecklist, 
  useUpdateChecklistItem, 
  useDeleteChecklist, 
  useDeleteChecklistItem,
  useReorderChecklists
} from '@/hooks/mutations/use-checklist-mutations'
import { useChecklistsByCard, checklistKeys } from '@/hooks/queries/use-checklists'

import { FormError } from '@/lib/form-error-handler'
import { updateTaskSchema } from '@/lib/validations/task'
import { 
  TCard, 
  isChecklistData, 
  isChecklistDropTargetData, 
  isDraggingAChecklist 
} from '@/utils/data'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { 
  extractClosestEdge 
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import DOMPurify from 'dompurify'
import {
  TextIcon,
  X,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Type,
} from 'lucide-react'
import { TaskDeleteDialog } from './task-delete-dialog'
import { Textarea } from '../ui/textarea'
import { DeleteActionButton } from '../delete-action-button'
import { AddChecklistButton } from '../add-checklist-button'
import { Checklist } from '../checklist'  

interface TaskEditModalProps {
  card: TCard
  columnTitle: string
  isOpen: boolean
  onClose: () => void
}

// Use types from validations
type CheckList = {
  id: string
  title: string
  items: CheckListItem[]
}

type CheckListItem = {
  id: string
  text: string
  isCompleted: boolean
}


interface EditorToolbarProps {
  editor: any
}

// MenuBar for Tiptap formatting - redesigned to match Simple Editor template
const MenuBar = ({ editor }: EditorToolbarProps) => {
  if (!editor) return null

  const getHeadingIcon = () => {
    if (editor.isActive('heading', { level: 1 })) return <Heading1 className="h-4 w-4" />
    if (editor.isActive('heading', { level: 2 })) return <Heading2 className="h-4 w-4" />
    if (editor.isActive('heading', { level: 3 })) return <Heading3 className="h-4 w-4" />
    if (editor.isActive('heading', { level: 4 })) return <Heading4 className="h-4 w-4" />
    if (editor.isActive('heading', { level: 5 })) return <Heading5 className="h-4 w-4" />
    if (editor.isActive('heading', { level: 6 })) return <Heading6 className="h-4 w-4" />
    return <Type className="h-4 w-4" />
  }

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-background">
      {/* Undo/Redo Group */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="h-8 w-8 p-0"
        aria-label="Undo"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="h-8 w-8 p-0"
        aria-label="Redo"
      >
        <Redo2 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 gap-1"
            aria-label="Text formatting"
          >
            {getHeadingIcon()}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={editor.isActive('paragraph') ? 'bg-accent' : ''}
          >
            <Type className="h-4 w-4 mr-2" />
            Paragraph
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
          >
            <Heading1 className="h-4 w-4 mr-2" />
            Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
          >
            <Heading2 className="h-4 w-4 mr-2" />
            Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
          >
            <Heading3 className="h-4 w-4 mr-2" />
            Heading 3
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            className={editor.isActive('heading', { level: 4 }) ? 'bg-accent' : ''}
          >
            <Heading4 className="h-4 w-4 mr-2" />
            Heading 4
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
            className={editor.isActive('heading', { level: 5 }) ? 'bg-accent' : ''}
          >
            <Heading5 className="h-4 w-4 mr-2" />
            Heading 5
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
            className={editor.isActive('heading', { level: 6 }) ? 'bg-accent' : ''}
          >
            <Heading6 className="h-4 w-4 mr-2" />
            Heading 6
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Text Formatting Group */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-accent' : ''}`}
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-accent' : ''}`}
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`h-8 w-8 p-0 ${editor.isActive('strike') ? 'bg-accent' : ''}`}
        aria-label="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`h-8 w-8 p-0 ${editor.isActive('code') ? 'bg-accent' : ''}`}
        aria-label="Code"
      >
        <Code className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists Group */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-accent' : ''}`}
        aria-label="Bullet list"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-accent' : ''}`}
        aria-label="Ordered list"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Block Elements Group */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`h-8 w-8 p-0 ${editor.isActive('codeBlock') ? 'bg-accent' : ''}`}
        aria-label="Code block"
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`h-8 w-8 p-0 ${editor.isActive('blockquote') ? 'bg-accent' : ''}`}
        aria-label="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="h-8 w-8 p-0"
        aria-label="Horizontal rule"
      >
        <Minus className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function TaskEditModal({ card, isOpen, onClose, columnTitle }: TaskEditModalProps) {
  const [title, setTitle] = useState(card.title)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch checklists for this card
  const { 
    data: fetchedChecklists = [], 
    isLoading: isLoadingChecklists, 
    error: checklistError 
  } = useChecklistsByCard(card.id)
  
  const [checklists, setChecklists] = useState<CheckList[]>([])
  const [optimisticChecklists, setOptimisticChecklists] = useState<string[]>([]) // Track optimistic checklist IDs

  // Sync fetched checklists with local state
  useEffect(() => {
    if (fetchedChecklists) {
      const transformedChecklists: CheckList[] = fetchedChecklists.map(checklist => ({
        id: checklist.id,
        title: checklist.title,
        items: checklist.items.map(item => ({
          id: item.id,
          text: item.text,
          isCompleted: item.isCompleted
        }))
      }))
      setChecklists(transformedChecklists)
    }
  }, [fetchedChecklists])

  const form = useForm({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: card.title,
      description: card.description || '',
    },
  })

  const updateTaskMutation = useUpdateTask({
    onSuccess: (updatedCard) => {
      setIsEditingTitle(false)
      setIsEditingDescription(false)
      setTitle(updatedCard.title)
    },
    onError: (error: FormError) => {
      setTitle(card.title)
      form.setValue('title', card.title)
      toast.error(error.message || 'Failed to update task')
    },
  })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
    ],
    content: card.description || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        spellcheck: 'false',
      },
    },
    onUpdate: ({ editor }) => {
      form.setValue('description', editor.getHTML())
    },
  })

  const handleTitleBlur = async () => {
    let newTitle = form.getValues('title')
    newTitle = newTitle?.trim()

    if (newTitle === card.title) {
      setIsEditingTitle(false)
      return
    }

    if (!newTitle?.trim()) {
      form.setValue('title', card.title)
      setTitle(card.title)
      setIsEditingTitle(false)
      return
    }

    setTitle(newTitle)

    updateTaskMutation.mutate({
      id: card.id as string,
      title: newTitle,
      description: card.description || null,
      columnId: card.columnId,
      order: card.order,
      projectId: card.projectId,
    })

    setIsEditingTitle(false)
  }

  const handleDescriptionSave = async () => {
    const description = form.getValues('description')
    if (description !== card.description) {
      updateTaskMutation.mutate({
        id: card.id as string,
        title: card.title,
        description: description,
        columnId: card.columnId,
        order: card.order,
        projectId: card.projectId,
      })
    }
    setIsEditingDescription(false)
  }

  const handleDescriptionCancel = () => {
    form.setValue('description', card.description || '')
    editor?.commands.setContent(card.description || '')
    setIsEditingDescription(false)
  }

  // Sync textarea height with content
  const syncTextareaHeight = () => {
    if (textareaRef.current) {
      // Reset height to get minimal height
      textareaRef.current.style.height = '0px'

      // Get the actual content height needed
      const scrollHeight = textareaRef.current.scrollHeight

      // Get padding values
      const computedStyle = getComputedStyle(textareaRef.current)
      const paddingTop = parseInt(computedStyle.paddingTop)
      const paddingBottom = parseInt(computedStyle.paddingBottom)

      // Calculate minimum height for single line
      const lineHeight = parseInt(computedStyle.lineHeight) || parseInt(computedStyle.fontSize) * 1.2
      const minHeight = lineHeight + paddingTop + paddingBottom

      // Use the smaller of scrollHeight or calculated minimum for tight fit
      const finalHeight = Math.max(minHeight, scrollHeight)

      textareaRef.current.style.height = `${finalHeight}px`
    }
  }

  useEffect(() => {
    if (isEditingTitle && textareaRef.current) {
      syncTextareaHeight()
    }
  }, [isEditingTitle, title])

  // Initialize mutation hooks with query invalidation
  const queryClient = useQueryClient()
  const createChecklistMutation = useCreateChecklist({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.byCard(card.id) })
    }
  })
  const createChecklistItemMutation = useCreateChecklistItem({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.byCard(card.id) })
    }
  })
  const updateChecklistMutation = useUpdateChecklist({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.byCard(card.id) })
    }
  })
  const updateChecklistItemMutation = useUpdateChecklistItem({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.byCard(card.id) })
    }
  })
  const deleteChecklistMutation = useDeleteChecklist({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.byCard(card.id) })
    }
  })
  const deleteChecklistItemMutation = useDeleteChecklistItem({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.byCard(card.id) })
    }
  })
  const reorderChecklistsMutation = useReorderChecklists({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.byCard(card.id) })
    }
  })

  // Add checklist drop monitoring
  useEffect(() => {
    return combine(
      monitorForElements({
        canMonitor: isDraggingAChecklist,
        onDrop({ source, location }) {
          const dragging = source.data;
          if (!isChecklistData(dragging)) {
            return;
          }

          const innerMost = location.current.dropTargets[0];
          if (!innerMost) {
            return;
          }

          const dropTargetData = innerMost.data;
          if (!isChecklistDropTargetData(dropTargetData)) {
            return;
          }

          const sourceChecklistId = dragging.checklist.id;
          const targetChecklistId = dropTargetData.checklist.id;

          if (sourceChecklistId === targetChecklistId) {
            return;
          }

          const sourceIndex = checklists.findIndex(checklist => checklist.id === sourceChecklistId);
          const targetIndex = checklists.findIndex(checklist => checklist.id === targetChecklistId);

          if (sourceIndex === -1 || targetIndex === -1) {
            return;
          }

          const closestEdge = extractClosestEdge(dropTargetData);
          const reordered = reorderWithEdge({
            axis: 'vertical',
            list: checklists,
            startIndex: sourceIndex,
            indexOfTarget: targetIndex,
            closestEdgeOfTarget: closestEdge,
          });

          // Optimistically update UI
          setChecklists(reordered);

          // Persist the reordering
          const checklistOrders = reordered.map((checklist, index) => ({
            id: checklist.id,
            order: index
          }));

          reorderChecklistsMutation.mutate({
            cardId: card.id,
            checklistOrders
          }, {
            onError: () => {
              // Revert on error
              setChecklists(checklists);
              toast.error('Failed to reorder checklists');
            }
          });
        }
      })
    );
  }, [checklists, card.id, reorderChecklistsMutation])

  const addChecklist = useCallback((title: string) => {
    // Create optimistic checklist immediately
    const tempId = `temp-checklist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const optimisticChecklist: CheckList = {
      id: tempId,
      title,
      items: []
    }
    
    // Add to optimistic state immediately
    setChecklists(prev => [...prev, optimisticChecklist])
    setOptimisticChecklists(prev => [...prev, tempId])
    
    // Call backend API
    createChecklistMutation.mutate(
      { title, cardId: card.id as string, order: checklists.length },
      {
        onSuccess: (realChecklist) => {
          // Replace optimistic checklist with real data
          setChecklists(prev => prev.map(checklist => 
            checklist.id === tempId 
              ? { 
                  id: realChecklist.id, 
                  title: realChecklist.title, 
                  items: realChecklist.items.map(item => ({
                    id: item.id,
                    text: item.text,
                    isCompleted: item.isCompleted
                  }))
                }
              : checklist
          ))
          setOptimisticChecklists(prev => prev.filter(id => id !== tempId))
        },
        onError: () => {
          // Remove optimistic checklist on error
          setChecklists(prev => prev.filter(checklist => checklist.id !== tempId))
          setOptimisticChecklists(prev => prev.filter(id => id !== tempId))
          toast.error('Failed to create checklist')
        }
      }
    )
  }, [card.id, createChecklistMutation, checklists.length])

  const deleteChecklist = useCallback((checklistId: string) => {
    // Optimistically remove checklist
    const checklistToDelete = checklists.find(c => c.id === checklistId)
    if (!checklistToDelete) return
    
    setChecklists(prev => prev.filter(checklist => checklist.id !== checklistId))
    
    // Only call API for real checklists (not optimistic ones)
    if (!optimisticChecklists.includes(checklistId)) {
      deleteChecklistMutation.mutate(checklistId, {
        onError: () => {
          // Restore checklist on error
          setChecklists(prev => [...prev, checklistToDelete])
          toast.error('Failed to delete checklist')
        }
      })
    }
  }, [checklists, optimisticChecklists, deleteChecklistMutation])

    const addChecklistItem = useCallback((checklistId: string, itemText: string) => {
    const tempId = `temp-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newItem: CheckListItem = {
      id: tempId,
      text: itemText,
      isCompleted: false
    }

    // Optimistically add item
    setChecklists(prev => prev.map(checklist =>
      checklist.id === checklistId
        ? { ...checklist, items: [...checklist.items, newItem] }
        : checklist
    ))

    // Only call API for real checklists (not optimistic ones)
    if (!optimisticChecklists.includes(checklistId)) {
      const checklist = checklists.find(c => c.id === checklistId)
      const itemOrder = checklist?.items.length || 0
      
      createChecklistItemMutation.mutate(
        { text: itemText, checklistId, order: itemOrder, isCompleted: false },
        {
          onSuccess: (realItem) => {
            // Replace optimistic item with real data
            setChecklists(prev => prev.map(checklist =>
              checklist.id === checklistId
                ? {
                    ...checklist,
                    items: checklist.items.map(item =>
                      item.id === tempId
                        ? { id: realItem.id, text: realItem.text, isCompleted: realItem.isCompleted }
                        : item
                    )
                  }
                : checklist
            ))
          },
          onError: () => {
            // Remove optimistic item on error
            setChecklists(prev => prev.map(checklist =>
              checklist.id === checklistId
                ? { ...checklist, items: checklist.items.filter(item => item.id !== tempId) }
                : checklist
            ))
            toast.error('Failed to add checklist item')
          }
        }
      )
    }
  }, [checklists, optimisticChecklists, createChecklistItemMutation])

    const deleteChecklistItem = useCallback((checklistId: string, itemId: string) => {
    // Find the item to delete for potential restoration
    const checklist = checklists.find(c => c.id === checklistId)
    const itemToDelete = checklist?.items.find(item => item.id === itemId)
    if (!itemToDelete) return

    // Optimistically remove item
    setChecklists(prev => prev.map(checklist =>
      checklist.id === checklistId
        ? { ...checklist, items: checklist.items.filter(item => item.id !== itemId) }
        : checklist
    ))

    // Only call API for real items (not optimistic ones)
    if (!itemId.startsWith('temp-')) {
      deleteChecklistItemMutation.mutate(itemId, {
        onError: () => {
          // Restore item on error
          setChecklists(prev => prev.map(checklist =>
            checklist.id === checklistId
              ? { ...checklist, items: [...checklist.items, itemToDelete] }
              : checklist
          ))
          toast.error('Failed to delete checklist item')
        }
      })
    }
  }, [checklists, deleteChecklistItemMutation])

    const toggleChecklistItem = useCallback((checklistId: string, itemId: string) => {
    const checklist = checklists.find(c => c.id === checklistId)
    const item = checklist?.items.find(i => i.id === itemId)
    if (!item) return

    const newCompletedState = !item.isCompleted

    // Optimistically update
    setChecklists(prev => prev.map(checklist =>
      checklist.id === checklistId
        ? {
          ...checklist,
          items: checklist.items.map(item =>
            item.id === itemId
              ? { ...item, isCompleted: newCompletedState }
              : item
          )
        }
        : checklist
    ))

    // Only call API for real items (not optimistic ones)
    if (!itemId.startsWith('temp-')) {
      updateChecklistItemMutation.mutate(
        { id: itemId, isCompleted: newCompletedState },
        {
          onError: () => {
            // Revert optimistic update on error
            setChecklists(prev => prev.map(checklist =>
              checklist.id === checklistId
                ? {
                  ...checklist,
                  items: checklist.items.map(item =>
                    item.id === itemId
                      ? { ...item, isCompleted: !newCompletedState }
                      : item
                  )
                }
                : checklist
            ))
            toast.error('Failed to update checklist item')
          }
        }
      )
    }
  }, [checklists, updateChecklistItemMutation])

    const updateChecklistTitle = useCallback((checklistId: string, newTitle: string) => {
    const originalTitle = checklists.find(c => c.id === checklistId)?.title
    if (!originalTitle || originalTitle === newTitle) return

    // Optimistically update
    setChecklists(prev => prev.map(checklist =>
      checklist.id === checklistId
        ? { ...checklist, title: newTitle }
        : checklist
    ))

    // Only call API for real checklists (not optimistic ones)
    if (!optimisticChecklists.includes(checklistId)) {
      updateChecklistMutation.mutate(
        { id: checklistId, title: newTitle },
        {
          onError: () => {
            setChecklists(prev => prev.map(checklist =>
              checklist.id === checklistId
                ? { ...checklist, title: originalTitle }
                : checklist
            ))
            toast.error('Failed to update checklist title')
          }
        }
      )
    }
  }, [checklists, optimisticChecklists, updateChecklistMutation])

  // Note: updateChecklistItemTitle function is defined but not used as the Checklist component doesn't support item title editing yet
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateChecklistItemTitle = useCallback((checkListIndex: number, itemId: string, newTitle: string) => {
    const checklist = checklists[checkListIndex]
    const originalText = checklist?.items.find(i => i.id === itemId)?.text
    if (!originalText || originalText === newTitle) return

    // Optimistically update
    setChecklists(prev => prev.map(checklist =>
      checklist.id === checklists[checkListIndex].id
        ? { 
            ...checklist, 
            items: checklist.items.map(item => 
              item.id === itemId 
                ? { ...item, text: newTitle } 
                : item
            )
          }
        : checklist
    ))

    // Only call API for real items (not optimistic ones)
    if (!itemId.startsWith('temp-')) {
      updateChecklistItemMutation.mutate(
        { id: itemId, text: newTitle },
        {
          onError: () => {
            // Revert optimistic update on error
            setChecklists(prev => prev.map(checklist =>
              checklist.id === checklists[checkListIndex].id
                ? { 
                    ...checklist, 
                    items: checklist.items.map(item => 
                      item.id === itemId 
                        ? { ...item, text: originalText } 
                        : item
                    )
                  }
                : checklist
            ))
            toast.error('Failed to update checklist item text')
          }
        }
      )
    }
  }, [checklists, updateChecklistItemMutation])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContentWithoutClose className="sm:max-w-[800px]">
        <DialogTitle className="sr-only">Edit Task</DialogTitle>
        <div className="flex flex-col gap-4 w-full max-w-full">
          <div className="flex w-full max-w-full gap-4">
            <div className="flex flex-col gap-1 flex-[1_1_auto] w-full max-w-full overflow-hidden">
              {isEditingTitle ? (
                <Textarea
                  className="w-full max-w-full break-all whitespace-break-spaces resize-none p-2 overflow-hidden"
                  {...form.register('title')}
                  ref={(el) => {
                    const { ref } = form.register('title');
                    if (typeof ref === 'function') ref(el);
                    textareaRef.current = el;
                    // Sync height when element is first set
                    if (el) {
                      setTimeout(() => syncTextareaHeight(), 0);
                    }
                  }}
                  autoFocus
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  onInput={syncTextareaHeight}
                />
              ) : (
                <div
                  className="cursor-pointer p-2 w-full max-w-full break-words whitespace-pre-line overflow-hidden"
                  onClick={() => setIsEditingTitle(true)}>
                  <p className="w-full max-w-full break-words overflow-hidden">
                    {title}
                  </p>
                </div>
              )}

              {columnTitle !== '' && columnTitle !== null && columnTitle !== undefined && (
                <div className="flex items-center gap-2 text-sm p-2">
                  <span>in list</span>
                  <span className="bg-muted px-2 py-1 rounded text-foreground font-medium">
                    {columnTitle}
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-[1_1_auto] p-2 hover:bg-accent rounded-sm transition-colors max-h-[min-content]"
              aria-label="Close dialog">
              <X className="h-4 w-4" />
            </button>
          </div>



          <div className="flex flex-col gap-4">
            <div className="flex flex-1 gap-4">
              <div className="flex-[2_0_80%]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className='flex items-center gap-2'>
                      <TextIcon className="h-4 w-4 text-gray-500" />
                      <label className="text-sm font-medium">Description</label>
                    </div>

                    {isEditingDescription ? (
                      <div className="space-y-2">
                        <div className="bg-background border border-gray-500">
                          <MenuBar editor={editor} />
                          <div className="min-h-[200px] p-4">
                            <EditorContent
                              editor={editor}
                              className="prose prose-sm max-w-none dark:prose-invert focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:border-none [&_.ProseMirror]:break-all [&_.ProseMirror]:overflow-wrap-anywhere bg-background"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={handleDescriptionCancel}
                            disabled={updateTaskMutation.isPending}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleDescriptionSave}
                            disabled={updateTaskMutation.isPending}>
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer rounded-md border border-transparent p-2 hover:border-border transition-opacity duration-200 hover:opacity-70 focus-within:opacity-70"
                        onClick={() => setIsEditingDescription(true)}
                        tabIndex={0}
                        aria-label="Edit description"
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setIsEditingDescription(true) }}
                      >
                        {card.description ? (
                          <div
                            className="prose prose-sm max-w-none ProseMirror break-all overflow-wrap-anywhere"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(card.description) }}
                          />
                        ) : (
                          <p className="text-muted-foreground">Add a description...</p>
                        )}
                      </div>

                    )}
                    
                    {/* Loading state for checklists */}
                    {isLoadingChecklists && (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2 text-sm text-muted-foreground">Loading checklists...</span>
                      </div>
                    )}
                    
                    {/* Error state for checklists */}
                    {checklistError && (
                      <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
                        <p className="text-sm text-destructive">
                          Failed to load checklists. Please try refreshing the page.
                        </p>
                      </div>
                    )}
                    
                    {/* Render all checklists */}
                    {checklists.map((checklist) => (
                      <Checklist
                        key={checklist.id}
                        id={checklist.id}
                        cardId={card.id}
                        title={checklist.title}
                        items={checklist.items}
                        onAddItem={(itemText) => addChecklistItem(checklist.id, itemText)}
                        onDeleteItem={(itemId) => deleteChecklistItem(checklist.id, itemId)}
                        onToggleItem={(itemId) => toggleChecklistItem(checklist.id, itemId)}
                        onDelete={() => deleteChecklist(checklist.id)}
                        onUpdateTitle={(newTitle) => updateChecklistTitle(checklist.id, newTitle)}
                        className="mt-4"
                      />
                    ))}
                   
                  </div>
                </div>
              </div>
              <div className="flex flex-[1_1_auto] flex-col gap-1">
                <p className="text-sm font-medium mb-2">Actions</p>
                <DeleteActionButton onClick={() => setIsDeleteDialogOpen(true)} className="mb-2">
                  Delete Card
                </DeleteActionButton>

                <AddChecklistButton onAddChecklist={addChecklist}>
                  Add Checklist
                </AddChecklistButton>
              </div>
            </div>
          </div>
        </div>
      </DialogContentWithoutClose>

      <TaskDeleteDialog
        card={card}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDeleted={onClose}
      />
    </Dialog>
  )
} 