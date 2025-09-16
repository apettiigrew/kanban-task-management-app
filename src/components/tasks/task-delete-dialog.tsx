'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeleteTask } from '@/hooks/mutations/use-task-mutations'
import { TCard } from '@/models/card'
import { useCallback, useMemo } from 'react'

interface TaskDeleteDialogProps {
  card: TCard
  isOpen: boolean
  onClose: () => void
  onDeleted?: () => void
  
}

export function TaskDeleteDialog(props: TaskDeleteDialogProps) {
  const { card, isOpen, onClose, onDeleted } = props
  const deleteTaskMutation = useDeleteTask()

  
  const displayTitle = useMemo(() => {
    return card.title.length > 50 ? `${card.title.substring(0, 50)}...` : card.title
  }, [card.title])

  const handleDelete = useCallback(() => {
    deleteTaskMutation.mutate({
      id: card.id as string,
      projectId: card.projectId,
      columnId: card.columnId,
    },{
      onSuccess: () => {
        onClose()
        onDeleted?.()
      }
    })
  }, [card.id, card.projectId, card.columnId, deleteTaskMutation, onClose, onDeleted])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-w-[90vw] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Delete Card</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete this card? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 w-full overflow-hidden">
          <div className="rounded-md border p-3 bg-muted/50 max-h-16 overflow-hidden w-full min-w-0">
            <p className="font-medium text-sm truncate w-full min-w-0 overflow-hidden">
              {displayTitle}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteTaskMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={(e)=>{
              e.preventDefault()
              e.stopPropagation()
              handleDelete()
            }}
            disabled={deleteTaskMutation.isPending}
          >
            {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 