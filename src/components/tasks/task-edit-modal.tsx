'use client'

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
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useUpdateTask } from '@/hooks/mutations/use-task-mutations'
import { useColumn } from '@/hooks/queries/use-columns'
import { FormError } from '@/lib/form-error-handler'
import { updateTaskSchema } from '@/lib/validations/task'
import { TCard } from '@/utils/data'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import DOMPurify from 'dompurify'
import {
  TextIcon,
  Trash2,
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
  Type
} from 'lucide-react'
import { TaskDeleteDialog } from './task-delete-dialog'
import { Textarea } from '../ui/textarea'
import { DeleteActionButton } from '../delete-action-button'

interface TaskEditModalProps {
  card: TCard
  columnTitle: string
  isOpen: boolean
  onClose: () => void
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
  const [description, setDescription] = useState(card.description)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const queryClient = useQueryClient()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
                            disabled={updateTaskMutation.isPending}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleDescriptionSave}
                            disabled={updateTaskMutation.isPending}
                          >
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
                  </div>
                </div>
              </div>
              <div className="flex-[1_1_auto]">
                <p className="text-sm font-medium mb-2">Actions</p>
                <DeleteActionButton onClick={() => setIsDeleteDialogOpen(true)}>
                  Delete Card
                </DeleteActionButton>
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