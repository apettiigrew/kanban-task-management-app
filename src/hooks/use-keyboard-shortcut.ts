import { useEffect, useState, useCallback } from 'react'

interface UseKeyboardShortcutOptions {
  key: string
  preventDefault?: boolean
  ignoreInputs?: boolean
}

export const useKeyboardShortcut = ({
  key,
  preventDefault = true,
  ignoreInputs = true
}: UseKeyboardShortcutOptions) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const openDialog = useCallback(() => {
    setIsDialogOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === key.toLowerCase() && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // Only trigger if not typing in an input field (when ignoreInputs is true)
        if (ignoreInputs) {
          const target = event.target as HTMLElement
          if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
            return
          }
        }

        if (preventDefault) {
          event.preventDefault()
        }
        
        openDialog()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [key, openDialog, preventDefault, ignoreInputs])

  const setDialogOpen = useCallback((open: boolean) => {
    if (open) {
      setIsDialogOpen(true)
    } else {
      setIsDialogOpen(false)
    }
  }, [])

  return { isDialogOpen, setIsDialogOpen: setDialogOpen, openDialog }
}
