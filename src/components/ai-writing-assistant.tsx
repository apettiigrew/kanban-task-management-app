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
  Sparkles,
  TicketIcon
} from 'lucide-react'
import { LoadingSpinner } from '@/components/loading-spinner'
import { WandIcon } from './icons/icons'

interface AIWritingAssistantProps {
  onImproveWriting?: () => void
  onMakeSMART?: () => void
  onMakeLonger?: () => void
  onMakeShorter?: () => void
  onMakeSoftwareTicket?: () => void
  isLoading?: boolean
  className?: string
  showMakeSoftwareTicket?: boolean,
}

export function AIWritingAssistant(props: AIWritingAssistantProps) {
  const {
    onImproveWriting,
    onMakeSMART,
    onMakeLonger,
    onMakeShorter,
    onMakeSoftwareTicket,
    isLoading = false,
    showMakeSoftwareTicket = false,
  } = props

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-8 w-8 flex items-center justify-center text-muted-foreground cursor-pointer p-1 hover:bg-accent rounded-sm transition-all duration-200"
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="h-4 w-4" />
          ) : (
            <WandIcon className="text-blue-500" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel className="text-sm font-medium text-muted-foreground">
          Edit
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={onImproveWriting}
          disabled={isLoading}
          className="flex items-center gap-3 px-3 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span>Improve writing</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onMakeLonger}
          disabled={isLoading}
          className="flex items-center gap-3 px-3 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <AlignJustify className="h-4 w-4 text-purple-500" />
          <span>Make longer</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onMakeShorter}
          disabled={isLoading}
          className="flex items-center gap-3 px-3 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Minus className="h-4 w-4 text-purple-500" />
          <span>Make shorter</span>
        </DropdownMenuItem>
        {showMakeSoftwareTicket && <DropdownMenuItem
          onClick={onMakeSoftwareTicket}
          disabled={isLoading}
          className="flex items-center gap-3 px-3 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TicketIcon className="h-4 w-4 text-purple-500" />
          <span>Make software ticket</span>
        </DropdownMenuItem>}
        <DropdownMenuItem
          onClick={onMakeSMART}
          disabled={isLoading}
          className="flex items-center gap-3 px-3 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Make specific</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}