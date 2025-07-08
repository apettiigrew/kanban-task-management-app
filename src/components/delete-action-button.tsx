import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface DeleteActionButtonProps {
  onClick: () => void
  disabled?: boolean
  children?: React.ReactNode
}

export function DeleteActionButton({ onClick, disabled = false, children = "Delete" }: DeleteActionButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="w-full justify-start gap-2 text-destructive hover:bg-accent hover:text-accent-foreground"
    >
      <Trash2 className="h-4 w-4" />
      {children}
    </Button>
  )
} 