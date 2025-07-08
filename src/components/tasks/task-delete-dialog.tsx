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
import { FormError } from '@/lib/form-error-handler'
import { TCard } from '@/utils/data'
import { toast } from 'sonner'

interface TaskDeleteDialogProps {
  card: TCard
  isOpen: boolean
  onClose: () => void
  onDeleted?: () => void
}

export function TaskDeleteDialog({ card, isOpen, onClose, onDeleted }: TaskDeleteDialogProps) {
  const deleteTaskMutation = useDeleteTask({
    onSuccess: () => {
      toast.success('Card deleted successfully')
      onClose()
      onDeleted?.()
    },
    onError: (error: FormError) => {
      toast.error(error.message || 'Failed to delete card')
    },
  })

  const handleDelete = () => {
    deleteTaskMutation.mutate({
      id: card.id as string,
      projectId: card.projectId,
      columnId: card.columnId,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Card</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete this card? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="rounded-md border p-3 bg-muted/50">
            <p className="font-medium text-sm truncate">{card.title}</p>
            {card.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {card.description.replace(/<[^>]*>/g, '').trim()}
              </p>
            )}
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
            onClick={handleDelete}
            disabled={deleteTaskMutation.isPending}
          >
            {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 