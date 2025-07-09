import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface AddChecklistButtonProps {
  onClick?: () => void
  disabled?: boolean
  children?: React.ReactNode
}

export function AddChecklistButton({ onClick, disabled = false, children = "Add Checklist" }: AddChecklistButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="w-full justify-start gap-2 hover:bg-accent hover:text-accent-foreground"
    >
      <Plus className="h-4 w-4" />
      {children}
    </Button>
  )
} 