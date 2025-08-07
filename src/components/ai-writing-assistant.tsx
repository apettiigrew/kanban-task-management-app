'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlignJustify,
  CheckCircle,
  Minus,
  Sparkles
} from 'lucide-react'
import { WandIcon } from './icons/icons'

interface AIWritingAssistantProps {
  onImproveWriting?: () => void
  onMakeSMART?: () => void
  onMakeLonger?: () => void
  onMakeShorter?: () => void
  className?: string
}

export function AIWritingAssistant(props: AIWritingAssistantProps) {
  const {
    onImproveWriting,
    onMakeSMART,
    onMakeLonger,
    onMakeShorter,
  } = props

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <WandIcon className="h-8 w-8 text-muted-foreground cursor-pointer p-1 hover:bg-accent rounded-sm transition-all duration-200" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel className="text-sm font-medium text-muted-foreground">
          Edit
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={onImproveWriting}
          className="flex items-center gap-3 px-3 py-2 cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span>Improve writing</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onMakeLonger}
          className="flex items-center gap-3 px-3 py-2 cursor-pointer"
        >
          <AlignJustify className="h-4 w-4 text-purple-500" />
          <span>Make longer</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onMakeShorter}
          className="flex items-center gap-3 px-3 py-2 cursor-pointer"
        >
          <Minus className="h-4 w-4 text-purple-500" />
          <span>Make shorter</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onMakeSMART}
          className="flex items-center gap-3 px-3 py-2 cursor-pointer"
        >
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Make specific</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}