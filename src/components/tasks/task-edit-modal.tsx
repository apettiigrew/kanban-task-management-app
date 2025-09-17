"use client"

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContentWithoutClose,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { handleImproveWritingOpenAI, handleMakeLongerOpenAI, handleMakeSMARTOpenAI, handleMakeShorterOpenAI } from '@/service/openai-service'

import {
  useCreateChecklist,
  useCreateChecklistItem,
  useDeleteChecklist,
  useDeleteChecklistItem,
  useReorderChecklistItems,
  useReorderChecklists,
  useUpdateChecklist,
  useUpdateChecklistItem
} from '@/hooks/mutations/use-checklist-mutations'
import { useUpdateTask } from '@/hooks/mutations/use-task-mutations'
import { useChecklistsByCard } from '@/hooks/queries/use-checklists'

import { projectKeys } from '@/hooks/queries/use-projects'
import { TCard } from '@/models/card'
import { TChecklist } from '@/models/checklist'
import { TChecklistItem } from '@/models/checklist-item'
import {
  isChecklistData,
  isChecklistDropTargetData,
  isChecklistItemData,
  isChecklistItemDropTargetData,
  isDraggingAChecklist,
  isDraggingAChecklistItem
} from '@/utils/data'
import {
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useQueryClient } from '@tanstack/react-query'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import DOMPurify from 'dompurify'
import {
  TextIcon,
  X
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AddChecklistButton } from '../add-checklist-button'

import { useTaskDialog } from '@/contexts/task-dialog-context'
import { AIWritingAssistant } from '../ai-writing-assistant'
import { Checklist } from '../checklist/checklist'
import { DeleteActionButton } from '../delete-action-button'
import { MenuBar } from '../editor/menubar'
import { Textarea } from '../ui/textarea'
import { AddLabelButton } from '../add-label-button'

interface TaskEditModalProps {
  card: TCard
  columnTitle: string
  isOpen: boolean
  onClose: () => void
}
export function TaskEditModal({ card, isOpen, onClose, columnTitle }: TaskEditModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [checklists, setChecklists] = useState<TChecklist[]>([])
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const checklistsInitialized = useRef(false)
  const { openDeleteModal } = useTaskDialog()

  const queryClient = useQueryClient()
  const createChecklistMutation = useCreateChecklist()
  const updateChecklistMutation = useUpdateChecklist()
  const deleteChecklistMutation = useDeleteChecklist()
  const createChecklistItemMutation = useCreateChecklistItem()
  const updateChecklistItemMutation = useUpdateChecklistItem()
  const deleteChecklistItemMutation = useDeleteChecklistItem()
  const reorderChecklistsMutation = useReorderChecklists()
  const reorderChecklistItemsMutation = useReorderChecklistItems()
  const updateTaskMutation = useUpdateTask()

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
      // setDescription(editor.getHTML())
    },
  })

  const {
    data: fetchedChecklists = [],
  } = useChecklistsByCard(card.id)

  useEffect(() => {
    if (fetchedChecklists.length > 0 && !checklistsInitialized.current) {
      setChecklists(fetchedChecklists)
      checklistsInitialized.current = true
    }

    return () => {
      checklistsInitialized.current = false
    }
  }, [fetchedChecklists])

  const handleTitleBlur = useCallback(async () => {
    let newTitle = title
    newTitle = newTitle?.trim()

    if (newTitle === card.title) {
      setIsEditingTitle(false)
      return
    }

    if (!newTitle?.trim()) {
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
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(card.projectId) })
      },
      onError: () => {
        setTitle(card.title)
      }
    })

    setIsEditingTitle(false)
  }, [
    card.title,
    card.description,
    card.columnId,
    card.order,
    card.projectId,
    setTitle, setIsEditingTitle, updateTaskMutation])

  const handleDescriptionSave = useCallback(async () => {
    const description = editor?.getHTML()
    if (description !== card.description) {
      updateTaskMutation.mutate({
        id: card.id as string,
        title: card.title,
        description: description,
        columnId: card.columnId,
        order: card.order,
        projectId: card.projectId,
      },
        {
          onSuccess: (updatedCard) => {
            setIsEditingDescription(false)
            setDescription(updatedCard.description || '')
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(card.projectId) })
          },
          onError: () => {
            setTitle(card.title)
          },
        })
    }
    setIsEditingDescription(false)
  }, [card.description, setIsEditingDescription, updateTaskMutation])

  const handleDescriptionCancel = useCallback(() => {
    // form.setValue('description', card.description || '')
    editor?.commands.setContent(card.description || '')
    setIsEditingDescription(false)
  }, [card.description, editor, setIsEditingDescription])

  const syncTextareaHeight = useCallback(() => {
    if (titleRef.current) {
      // Reset height to get minimal height
      titleRef.current.style.height = '0px'

      // Get the actual content height needed
      const scrollHeight = titleRef.current.scrollHeight

      // Get padding values
      const computedStyle = getComputedStyle(titleRef.current)
      const paddingTop = parseInt(computedStyle.paddingTop)
      const paddingBottom = parseInt(computedStyle.paddingBottom)

      // Calculate minimum height for single line
      const lineHeight = parseInt(computedStyle.lineHeight) || parseInt(computedStyle.fontSize) * 1.2
      const minHeight = lineHeight + paddingTop + paddingBottom

      // Use the smaller of scrollHeight or calculated minimum for tight fit
      const finalHeight = Math.max(minHeight, scrollHeight)

      titleRef.current.style.height = `${finalHeight}px`
    }
  }, [titleRef])

  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      syncTextareaHeight()
    }
  }, [isEditingTitle, title, syncTextareaHeight])

  useEffect(() => {
    return combine(
      monitorForElements({
        canMonitor: isDraggingAChecklistItem,
        onDrop({ source, location }) {
          const dragging = source.data;
          if (!isChecklistItemData(dragging)) {
            return;
          }

          const innerMost = location.current.dropTargets[0];
          if (!innerMost) {
            return;
          }

          const dropTargetData = innerMost.data;

          // Handle dropping on another checklist item
          if (isChecklistItemDropTargetData(dropTargetData)) {
            const sourceItem = dragging.item;
            const targetItem = dropTargetData.item;
            const sourceChecklistId = dragging.checklistId as string;
            const targetChecklistId = dropTargetData.checklistId as string;

            if (sourceItem.id === targetItem.id) {
              return;
            }

            const sourceChecklist = checklists.find(c => c.id === sourceChecklistId);
            const targetChecklist = checklists.find(c => c.id === targetChecklistId);

            if (!sourceChecklist || !targetChecklist) {
              return;
            }

            const sourceItemIndex = sourceChecklist.items.findIndex(item => item.id === sourceItem.id);
            const targetItemIndex = targetChecklist.items.findIndex(item => item.id === targetItem.id);

            if (sourceItemIndex === -1 || targetItemIndex === -1) {
              return;
            }

            const closestEdge = extractClosestEdge(dropTargetData);
            const isMovingToSameChecklist = sourceChecklistId === targetChecklistId;

            if (isMovingToSameChecklist) {
              // Reordering within the same checklist
              const reordered = reorderWithEdge({
                axis: 'vertical',
                list: sourceChecklist.items,
                startIndex: sourceItemIndex,
                indexOfTarget: targetItemIndex,
                closestEdgeOfTarget: closestEdge,
              });

              // Optimistically update UI
              setChecklists(prev => prev.map(checklist =>
                checklist.id === sourceChecklistId
                  ? { ...checklist, items: reordered }
                  : checklist
              ));

              // Persist the reordering
              const itemOrders = reordered.map((item, index) => ({
                id: item.id,
                order: index,
                checklistId: sourceChecklistId
              }));

              reorderChecklistItemsMutation.mutate({
                checklistId: sourceChecklistId,
                itemOrders
              }, {
                onError: () => {
                  // Revert on error
                  setChecklists(checklists);
                }
              });
            } else {
              // Moving item between checklists
              const finalIndex = closestEdge === 'bottom' ? targetItemIndex + 1 : targetItemIndex;

              // Remove from source checklist
              const newSourceItems = sourceChecklist.items.filter(item => item.id !== sourceItem.id);

              // Add to target checklist
              const newTargetItems = [...targetChecklist.items];
              newTargetItems.splice(finalIndex, 0, sourceItem);

              // Optimistically update UI
              setChecklists(prev => prev.map(checklist => {
                if (checklist.id === sourceChecklistId) {
                  return { ...checklist, items: newSourceItems };
                } else if (checklist.id === targetChecklistId) {
                  return { ...checklist, items: newTargetItems };
                }
                return checklist;
              }));

              // Prepare item orders for both checklists
              const sourceItemOrders = newSourceItems.map((item, index) => ({
                id: item.id,
                order: index,
                checklistId: sourceChecklistId
              }));

              const targetItemOrders = newTargetItems.map((item, index) => ({
                id: item.id,
                order: index,
                checklistId: targetChecklistId
              }));

              const allItemOrders = [...sourceItemOrders, ...targetItemOrders];

              reorderChecklistItemsMutation.mutate({
                checklistId: targetChecklistId, // Main checklist for the operation
                itemOrders: allItemOrders
              }, {
                onError: () => {
                  // Revert on error
                  setChecklists(checklists);
                }
              });
            }
            return;
          }

          // Handle dropping on a checklist (empty area)
          if (isChecklistDropTargetData(dropTargetData)) {
            const sourceItem = dragging.item;
            const sourceChecklistId = dragging.checklistId as string;
            const targetChecklistId = dropTargetData.checklist.id;

            if (sourceChecklistId === targetChecklistId) {
              return; // No change needed
            }

            const sourceChecklist = checklists.find(c => c.id === sourceChecklistId);
            const targetChecklist = checklists.find(c => c.id === targetChecklistId);

            if (!sourceChecklist || !targetChecklist) {
              return;
            }

            // Remove from source checklist
            const newSourceItems = sourceChecklist.items.filter(item => item.id !== sourceItem.id);

            // Add to end of target checklist
            const newTargetItems = [...targetChecklist.items, sourceItem];

            // Optimistically update UI
            setChecklists(prev => prev.map(checklist => {
              if (checklist.id === sourceChecklistId) {
                return { ...checklist, items: newSourceItems };
              } else if (checklist.id === targetChecklistId) {
                return { ...checklist, items: newTargetItems };
              }
              return checklist;
            }));

            // Prepare item orders for both checklists
            const sourceItemOrders = newSourceItems.map((item, index) => ({
              id: item.id,
              order: index,
              checklistId: sourceChecklistId
            }));

            const targetItemOrders = newTargetItems.map((item, index) => ({
              id: item.id,
              order: index,
              checklistId: targetChecklistId
            }));

            const allItemOrders = [...sourceItemOrders, ...targetItemOrders];

            reorderChecklistItemsMutation.mutate({
              checklistId: targetChecklistId,
              itemOrders: allItemOrders
            }, {
              onError: () => {
                // Revert on error
                setChecklists(checklists);
              }
            });
          }
        }
      }),
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
            }
          });
        }
      })
    );
  }, [checklists, card.id, reorderChecklistsMutation])

  const addChecklist = useCallback((title: string) => {

    let order = 0;
    if (checklists.length > 0) {
      order = (checklists.length - 1) + 1
    }

    // Create optimistic checklist immediately
    const tempId = `temp-checklist-${Math.floor(Math.random() * 5000) + 1}`
    const optimisticChecklist: TChecklist = {
      id: tempId,
      title,
      items: [],
      cardId: card.id as string,
      createdAt: new Date(),
      updatedAt: new Date(),
      order: order,
    }

    // Add to optimistic state immediately
    setChecklists(prev => [...prev, optimisticChecklist])

    // Call backend API
    createChecklistMutation.mutate(
      { title, cardId: card.id, order: order },
      {
        onSuccess: (data: TChecklist) => {
          // replace the optimisitc checklist with the real data checklist
          setChecklists(prev => prev.map(checklist =>
            checklist.id === tempId
              ? { ...checklist, ...data }
              : checklist
          ))

          queryClient.invalidateQueries({ queryKey: projectKeys.detail(card.projectId) })
        },
        onError: (_error) => {
          setChecklists(prev => prev.filter(checklist => checklist.id !== tempId))
        }
      }
    )
  }, [card.id, createChecklistMutation, checklists.length])

  const deleteChecklist = useCallback((checklistId: string) => {
    // Optimistically remove checklist
    const checklistToDelete = checklists.find(c => c.id === checklistId)
    if (!checklistToDelete) return

    setChecklists(prev => prev.filter(checklist => checklist.id !== checklistId))


    deleteChecklistMutation.mutate(checklistId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(card.projectId) })
      },
      onError: () => {
        setChecklists(prev => [...prev, checklistToDelete])
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(card.projectId) })
      }
    })

  }, [checklists, checklists, deleteChecklistMutation])

  const updateChecklistTitle = useCallback((checklistId: string, newTitle: string) => {
    const originalTitle = checklists.find(c => c.id === checklistId)?.title
    if (!originalTitle || originalTitle === newTitle) return

    // Optimistically update
    setChecklists(prev => prev.map(checklist =>
      checklist.id === checklistId
        ? { ...checklist, title: newTitle }
        : checklist
    ))

    updateChecklistMutation.mutate(
      { id: checklistId, title: newTitle, oldTitle: originalTitle },
      {
        onError: () => {
          setChecklists(prev =>
            prev.map(checklist =>
              checklist.id === checklistId
                ? { ...checklist, title: originalTitle }
                : checklist
            )
          );
        }
      }
    )

  }, [checklists, checklists, updateChecklistMutation])

  const addChecklistItem = useCallback((checklistId: string, itemText: string) => {
    const tempId = `temp-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newItem: TChecklistItem = {
      id: tempId,
      text: itemText,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      checklistId: checklistId,
      order: 0
    }

    // Optimistically add item
    setChecklists(prev => prev.map(checklist =>
      checklist.id === checklistId
        ? { ...checklist, items: [...checklist.items, newItem] }
        : checklist
    ))

    // Only call API for real checklists (not optimistic ones)
    const checklist = checklists.find(c => c.id === checklistId)
    const itemOrder = checklist?.items.length || 0

    createChecklistItemMutation.mutate(
      { text: itemText, checklistId, order: itemOrder, isCompleted: false },
      {
        onSuccess: (realItem: TChecklistItem) => {
          // Replace optimistic item with real data
          setChecklists(prev => prev.map(checklist =>
            checklist.id === checklistId
              ? {
                ...checklist,
                items: checklist.items.map(item =>
                  item.id === tempId
                    ? {
                      id: realItem.id,
                      text: realItem.text,
                      isCompleted: realItem.isCompleted,
                      createdAt: realItem.createdAt,
                      updatedAt: realItem.updatedAt,
                      checklistId: realItem.checklistId,
                      order: realItem.order
                    }
                    : item
                )
              }
              : checklist
          ))
          queryClient.invalidateQueries({ queryKey: projectKeys.detail(card.projectId) })
        },
        onError: () => {
          // Remove optimistic item on error
          setChecklists(prev => prev.map(checklist =>
            checklist.id === checklistId
              ? { ...checklist, items: checklist.items.filter(item => item.id !== tempId) }
              : checklist
          ))
        }
      }
    )
  }, [checklists, checklists, createChecklistItemMutation])

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

    deleteChecklistItemMutation.mutate(itemId);

  }, [checklists, deleteChecklistItemMutation, card.projectId]);

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
    updateChecklistItemMutation.mutate(
      { id: itemId, isCompleted: newCompletedState },
      {
        onSuccess: (data) => {

          // Update the checklist with new data returned
          setChecklists(prev => prev.map(checklist =>
            checklist.id === checklistId
              ? {
                ...checklist, items: checklist.items.map(item =>
                  item.id === itemId
                    ? { ...item, isCompleted: data.isCompleted }
                    : item
                )
              }
              : checklist
          ))

          queryClient.invalidateQueries({ queryKey: projectKeys.detail(card.projectId) })

        },
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
        }
      }
    )
  }, [checklists, updateChecklistItemMutation])

  const updateChecklistItemText = useCallback((checklistId: string, itemId: string, newText: string) => {
    const checklist = checklists.find(c => c.id === checklistId)
    const originalText = checklist?.items.find(i => i.id === itemId)?.text
    if (!originalText || originalText === newText) return

    // Optimistically update
    setChecklists(prev => prev.map(checklist =>
      checklist.id === checklistId
        ? {
          ...checklist,
          items: checklist.items.map(item =>
            item.id === itemId
              ? { ...item, text: newText }
              : item
          )
        }
        : checklist
    ))

    updateChecklistItemMutation.mutate(
      { id: itemId, text: newText },
      {
        onError: () => {
          // Revert optimistic update on error
          setChecklists(prev => prev.map(checklist =>
            checklist.id === checklistId
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
        }
      }
    )
  }, [checklists, updateChecklistItemMutation])


  const handleImproveWriting = useCallback(async () => {
    const oldTitle = title;
    setIsAIProcessing(true);
    
    try {
      const improvedTitle = await handleImproveWritingOpenAI(title)
      setTitle("")
      let index = 0;
      const interval = setInterval(() => {
        setTitle((prev) => prev + improvedTitle[index]);
        index++;
        if (index === improvedTitle.length) {
          clearInterval(interval);
          setIsAIProcessing(false);
        }
      }, 10);

      updateTaskMutation.mutate({
        id: card.id as string,
        title: improvedTitle,
        description: card.description || null,
        columnId: card.columnId,
        order: card.order,
        projectId: card.projectId,
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: projectKeys.detail(card.projectId) })
        },
        onError: () => {
          setTitle(oldTitle)
          setIsAIProcessing(false);
        }
      })
    } catch (_error) {
      setTitle(oldTitle);
      setIsAIProcessing(false);
    }
  }, [title]);

  const handleMakeLonger = useCallback(async () => {
    const oldTitle = title;
    setIsAIProcessing(true);
    
    try {
      const improvedTitle = await handleMakeLongerOpenAI(title)
      setTitle("")
      let index = 0;
      const interval = setInterval(() => {
        setTitle((prev) => prev + improvedTitle[index]);
        index++;
        if (index === improvedTitle.length) {
          clearInterval(interval);
          setIsAIProcessing(false);
        }
      }, 10);

      updateTaskMutation.mutate({
        id: card.id as string,
        title: improvedTitle,
        description: card.description || null,
        columnId: card.columnId,
        order: card.order,
        projectId: card.projectId,
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: projectKeys.detail(card.projectId) })
        },
        onError: () => {
          setTitle(oldTitle)
          setIsAIProcessing(false);
        }
      })
    } catch (_error) {
      setTitle(oldTitle);
      setIsAIProcessing(false);
    }
  }, [title]);

  const handleMakeShorter = useCallback(async () => {
    const oldTitle = title;
    setIsAIProcessing(true);
    
    try {
      const improvedTitle = await handleMakeShorterOpenAI(title)
      setTitle("")
      let index = 0;
      const interval = setInterval(() => {
        setTitle((prev) => prev + improvedTitle[index]);
        index++;
        if (index === improvedTitle.length) {
          clearInterval(interval);
          setIsAIProcessing(false);
        }
      }, 10);

      updateTaskMutation.mutate({
        id: card.id as string,
        title: improvedTitle,
        description: card.description || null,
        columnId: card.columnId,
        order: card.order,
        projectId: card.projectId,
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: projectKeys.detail(card.projectId) })
        },
        onError: () => {
          setTitle(oldTitle)
          setIsAIProcessing(false);
        }
      })
    } catch (_error) {
      setTitle(oldTitle);
      setIsAIProcessing(false);
    }
  }, [title]);

  const handleMakeSMART = useCallback(async () => {
    const oldTitle = title;
    setIsAIProcessing(true);
    
    try {
      const improvedTitle = await handleMakeSMARTOpenAI(title)
      setTitle("")
      let index = 0;
      const interval = setInterval(() => {
        setTitle((prev) => prev + improvedTitle[index]);
        index++;
        if (index === improvedTitle.length) {
          clearInterval(interval);
          setIsAIProcessing(false);
        }
      }, 10);

      updateTaskMutation.mutate({
        id: card.id as string,
        title: improvedTitle,
        description: card.description || null,
        columnId: card.columnId,
        order: card.order,
        projectId: card.projectId,
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: projectKeys.detail(card.projectId) })
        },
        onError: () => {
          setTitle(oldTitle)
          setIsAIProcessing(false);
        }
      })
    } catch (_error) {
      setTitle(oldTitle);
      setIsAIProcessing(false);
    }
  }, [title]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContentWithoutClose className="sm:max-w-[800px]">
        <DialogTitle className="sr-only">Edit Task</DialogTitle>
        <DialogDescription className="sr-only">
          Edit card details including title, description, and checklists
        </DialogDescription>
        <div className="flex flex-col gap-4 w-full max-w-full">
          <div className="flex w-full max-w-full items-start justify-between">
            <div className="flex flex-col gap-1 flex-[1_1_auto] w-full max-w-full overflow-hidden">
              <div className="flex items-start gap-2 w-full">
                {isEditingTitle ? (
                  <Textarea
                    className="flex-1 break-all whitespace-break-spaces resize-none p-2 overflow-hidden text-4xl font-bold"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    ref={(el) => {
                      titleRef.current = el;
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
                    className="cursor-pointer p-2 flex-1 break-words whitespace-pre-line overflow-hidden"
                    onClick={() => setIsEditingTitle(true)}>
                    <p className="break-words overflow-hidden text-4xl font-bold">
                      {title}
                    </p>
                  </div>
                )}
                <div className="flex-shrink-0 p-2 flex items-center">
                  <AIWritingAssistant
                    onImproveWriting={handleImproveWriting}
                    onMakeSMART={handleMakeSMART}
                    onMakeLonger={handleMakeLonger}
                    onMakeShorter={handleMakeShorter}
                    isLoading={isAIProcessing}
                  />
                </div>
              </div>

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
              className="p-2 hover:bg-accent rounded-sm transition-colors flex-shrink-0"
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
                          <MenuBar editor={editor} card={card} />
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
                            variant="primary"
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
                        {description ? (
                          <div
                            className="prose prose-sm max-w-none ProseMirror break-all overflow-wrap-anywhere"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
                          />
                        ) : (
                          <p className="text-muted-foreground">Add a description...</p>
                        )}
                      </div>
                    )}

                    <DisplayChecklist
                      checklists={checklists}
                      cardId={card.id}
                      onAddItem={addChecklistItem}
                      onDeleteItem={deleteChecklistItem}
                      onToggleItem={toggleChecklistItem}
                      onDelete={deleteChecklist}
                      onUpdateTitle={updateChecklistTitle}
                      onUpdateItemText={updateChecklistItemText}
                      className="mt-4"
                    />

                  </div>
                </div>
              </div>
              <div className="flex flex-[1_1_auto] flex-col gap-2">
                <p className="text-sm font-medium mb-2">Actions</p>
                <DeleteActionButton onClick={() => openDeleteModal(card)}>
                  Delete Card
                </DeleteActionButton>

                <AddChecklistButton onAddChecklist={addChecklist}>
                  Add Checklist
                </AddChecklistButton>

                <AddLabelButton
                  projectId={card.projectId}
                  onSelectLabel={(label) => {
                    // TODO: Implement label selection logic
                    console.log('Selected label:', label)
                  }}
                  onDeselectLabel={(labelId) => {
                    // TODO: Implement label deselection logic
                    console.log('Deselected label:', labelId)
                  }}
                >
                  Add Label
                </AddLabelButton>
              </div>
            </div>
          </div>
        </div>
      </DialogContentWithoutClose>
    </Dialog>
  )
}

interface DisplayChecklistProps {
  checklists: TChecklist[]
  cardId: string
  onAddItem: (checklistId: string, itemText: string) => void
  onDeleteItem: (checklistId: string, itemId: string) => void
  onToggleItem: (checklistId: string, itemId: string) => void
  onDelete: (checklistId: string) => void
  onUpdateTitle: (checklistId: string, newTitle: string) => void
  onUpdateItemText: (checklistId: string, itemId: string, newText: string) => void
  className?: string
}

export function DisplayChecklist(props: DisplayChecklistProps) {
  const {
    checklists,
    cardId,
    onAddItem,
    onDeleteItem,
    onToggleItem,
    onDelete,
    onUpdateTitle,
    onUpdateItemText,
    className
  } = props;

  // TODO: Drop checklist items on empty checklist
  return (
    <>
      {checklists.map((checklist) => (
        <Checklist
          key={checklist.id}
          cardId={cardId}

          checklist={checklist}
          onAddItem={(itemText) => onAddItem(checklist.id, itemText)}
          onDeleteItem={(itemId) => onDeleteItem(checklist.id, itemId)}
          onToggleItem={(itemId) => onToggleItem(checklist.id, itemId)}
          onDelete={() => onDelete(checklist.id)}
          onUpdateTitle={(newTitle) => onUpdateTitle(checklist.id, newTitle)}
          onUpdateItemText={(itemId, newText) => onUpdateItemText(checklist.id, itemId, newText)}
          className={className}
        />
      ))}
    </>
  )
}
