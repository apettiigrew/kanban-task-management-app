import { Button } from '@/components/ui/button'
import { cn } from '@/utils/utils';
import { Trash2 } from 'lucide-react'

interface DeleteActionButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function DeleteActionButton(props: DeleteActionButtonProps) {
  const { onClick, disabled, children, className } = props;

  const classNames = cn(
    "w-full justify-start gap-2 hover:bg-accent hover:text-accent-foreground",
    className ? className : ""
  );

  // console.log(classNames);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={classNames}
    >
      <Trash2 className="h-4 w-4" />
      {children}
    </Button>
  )
} 