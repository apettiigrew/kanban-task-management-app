"use client"

import '@/app/board.css';
import { Column } from '@/components/column/column';
import { EditableProjectTitle } from '@/components/editable-project-title';
import { ProjectDialog, ProjectDialogRef } from '@/components/project-dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useCreateColumn, useDeleteColumn, useReorderColumns } from '@/hooks/mutations/use-column-mutations';
import { useMoveTask, useReorderTasks } from '@/hooks/mutations/use-task-mutations';
import { projectKeys, useCloseBoard, useCreateProject, useProjects } from '@/hooks/queries/use-projects';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { BoardOperationQueue } from '@/lib/board-operation-queue';
import { TCard } from '@/models/card';
import { TColumn } from '@/models/column';
import { TProject } from '@/models/project';
import { SettingsContext } from '@/providers/settings-context';
import { isCardData, isCardDropTargetData, isColumnData, isDraggingACard, isDraggingAColumn } from '@/utils/data';
import { blockBoardPanningAttr } from '@/utils/data-attributes';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';
import {
    extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { CleanupFn } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { reorder } from '@atlaskit/pragmatic-drag-and-drop/reorder';
import { bindAll } from 'bind-event-listener';
import { FolderOpen, MoreHorizontal, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import invariant from 'tiny-invariant';

interface BoardProps {
    project: TProject
}

export function Board(props: BoardProps) {
    const { project } = props;
    const projectState = project;
    const queryClient = useQueryClient();
    const boardQueueRef = useRef<BoardOperationQueue>(new BoardOperationQueue());
    const [boardQueueStats, setBoardQueueStats] = useState(boardQueueRef.current.getStats());
    const createProjectMutation = useCreateProject();
    const {
        isDialogOpen: isProjectDialogOpen,
        setIsDialogOpen: setIsProjectDialogOpen
    } = useKeyboardShortcut({
        key: 'b'
    });

    const router = useRouter();
    const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
    const projectDialogRef = useRef<ProjectDialogRef>(null);

    const setProjectState = useCallback((updater: TProject | ((prev: TProject) => TProject)) => {
        queryClient.setQueryData(projectKeys.detail(project.id), (oldProject: TProject | undefined) => {
            const previous = oldProject ?? project;
            if (typeof updater === 'function') {
                return (updater as (prev: TProject) => TProject)(previous);
            }
            return updater;
        });
    }, [project, queryClient]);

    const [isAddingList, setIsAddingList] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [isCloseBoardDialogOpen, setIsCloseBoardDialogOpen] = useState(false);
    const { settings } = useContext(SettingsContext);
    const { mutate: closeBoard, isPending: isClosingBoard } = useCloseBoard();
    const scrollableRef = useRef<HTMLDivElement>(null);

    const createColumnMutation = useCreateColumn();
    const moveTaskMutation = useMoveTask({ enableOptimisticUpdate: false, autoInvalidate: false });
    const reorderTasksMutation = useReorderTasks({ enableOptimisticUpdate: false, autoInvalidate: false });
    const reorderColumnsMutation = useReorderColumns({ autoInvalidate: false });
    const deleteColumnMutation = useDeleteColumn({ enableOptimisticUpdate: false, autoInvalidate: false });

    useEffect(() => {
        const interval = setInterval(() => {
            setBoardQueueStats(boardQueueRef.current.getStats());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const refreshFromServer = () => {
            void queryClient.invalidateQueries({ queryKey: projectKeys.detail(project.id) });
        };

        const interval = setInterval(refreshFromServer, 15000);
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refreshFromServer();
            }
        };

        window.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            clearInterval(interval);
            window.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [project.id, queryClient]);

    const handleProjectSelect = useCallback((selectedProject: { id: string; name: string }) => {
        if (projectState && selectedProject.id !== projectState.id) {
            router.push(`/board/${selectedProject.id}`);
        }
    }, [projectState, router]);

    const handleCreateProject = useCallback((projectName: string) => {
        createProjectMutation.mutate({
            title: projectName,
            description: null
        }, {
            onSuccess: (newProject: TProject) => {
                projectDialogRef.current?.resetForm();
                setIsProjectDialogOpen(false);
                router.push(`/board/${newProject.id}`);
            }
        });
    }, [createProjectMutation, router, setIsProjectDialogOpen]);

    const handleCloseBoard = useCallback(() => {
        closeBoard(projectState.id);
        setIsCloseBoardDialogOpen(false);
        router.push('/home');
    }, [closeBoard, projectState?.id, router]);

    const handleDeleteColumn = useCallback((columnId: string) => {
        if (!projectState) return;

        const previousColumns = projectState.columns;
        const reorderedColumns = projectState.columns
            .filter((col) => col.id !== columnId)
            .map((col, index) => ({
            ...col,
            order: index
        }));
        setProjectState((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                columns: reorderedColumns
            } as TProject;
        });

        void boardQueueRef.current.enqueue({
            scopeKey: projectState.id,
            coalesceKey: `delete-column-${columnId}`,
            payload: {
                id: columnId,
                projectId: projectState.id
            },
            execute: async (payload) => {
                await deleteColumnMutation.mutateAsync(payload);
            }
        }).catch(() => {
            setProjectState((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    columns: previousColumns
                } as TProject;
            });
        });
    }, [projectState, deleteColumnMutation, setProjectState]);

    const handleAddList = useCallback(() => {
        if (!projectState) return;

        const trimmedTitle = newListTitle.trim();

        if (!trimmedTitle) {
            return;
        }

        let order = 0;
        if (projectState.columns.length === 0) {
            order = 0;
        } else {
            order = (projectState.columns.length - 1) + 1;
        }
        // Create optimistic column for immediate UI update
        const optimisticColumn: TColumn = {
            id: `temp-${Math.floor(Math.random() * 1000000)}`,
            title: trimmedTitle,
            projectId: projectState.id,
            order: order,
            createdAt: new Date(),
            updatedAt: new Date(),
            cards: [],
        };

        // Optimistically update UI
        setProjectState({ ...projectState, columns: [...projectState.columns, optimisticColumn] });
        setIsAddingList(false);
        setNewListTitle('');
        // Make the API call
        createColumnMutation.mutate({
            title: trimmedTitle,
            projectId: projectState.id,
            order: order
        }, {
            onSuccess: (data) => {

                setProjectState((prev) => {
                    if (!prev) return prev;
                    return ({
                        ...prev,
                        columns: prev.columns.map((column: TColumn) =>
                            column.id === optimisticColumn.id ? {
                                id: data.id,
                                title: data.title,
                                projectId: data.projectId,
                                order: data.order,
                                createdAt: data.createdAt,
                                updatedAt: data.updatedAt,
                                cards: []
                            } : column
                        ) as TColumn[]
                    }) as TProject;
                });
            },
            onError: () => {
                setProjectState((prev) => {
                    if (!prev) return prev;
                    return ({
                        ...prev,
                        columns: prev.columns.filter(column =>
                            column.id !== optimisticColumn.id
                        ) as TColumn[]
                    }) as TProject;
                });
            }
        });
    }, [projectState, createColumnMutation, newListTitle, setProjectState]);

    useEffect(() => {
        const element = scrollableRef.current;
        if (!element || !projectState) {
            return;
        }


        return combine(
            monitorForElements({
                canMonitor: isDraggingACard,
                onDrop({ source, location }) {
                    const dragging = source.data;
                    if (!isCardData(dragging)) {
                        return;
                    }

                    const innerMost = location.current.dropTargets[0];

                    if (!innerMost) {
                        return;
                    }
                    const dropTargetData = innerMost.data;
                    const homeColumnIndex = projectState.columns.findIndex(
                        (column) => column.id === dragging.columnId,
                    );
                    const home: TColumn | undefined = projectState.columns[homeColumnIndex];

                    if (!home) {
                        return;
                    }
                    const cardIndexInHome = home.cards.findIndex((card: TCard) => card.id === dragging.card.id);

                    // dropping on a card
                    if (isCardDropTargetData(dropTargetData)) {

                        const destinationColumnIndex = projectState.columns.findIndex(
                            (column) => column.id === dropTargetData.columnId,
                        );
                        const destination = projectState.columns[destinationColumnIndex];

                        // reordering in home column
                        if (home === destination) {
                            const cardFinishIndex = home.cards.findIndex(
                                (card: TCard) => card.id === dropTargetData.card.id,
                            );

                            if (cardIndexInHome === -1 || cardFinishIndex === -1) {
                                return;
                            }

                            if (cardIndexInHome === cardFinishIndex) {
                                return;
                            }

                            const closestEdge = extractClosestEdge(dropTargetData);

                            const reordered = reorderWithEdge({
                                axis: 'vertical',
                                list: home.cards,
                                startIndex: cardIndexInHome,
                                indexOfTarget: cardFinishIndex,
                                closestEdgeOfTarget: closestEdge,
                            });

                            const reorderedCards = reordered.map((card, index) => ({
                                ...card,
                                order: index
                            }));

                            const updated: TColumn = {
                                ...home,
                                cards: reorderedCards,
                            };
                            const columns = Array.from(projectState.columns);
                            columns[homeColumnIndex] = updated;

                            // Optimistically update UI
                            setProjectState((prev) => {
                                return {
                                    ...prev,
                                    columns: columns
                                } as TProject;
                            });

                            const taskOrders = reorderedCards.map((card, index) => ({
                                id: String(card.id),
                                order: index
                            }));

                            void boardQueueRef.current.enqueue({
                                scopeKey: projectState.id,
                                coalesceKey: `reorder-cards-${home.id}`,
                                payload: {
                                    columnId: home.id,
                                    projectId: projectState.id,
                                    taskOrders
                                },
                                execute: async (payload) => {
                                    await reorderTasksMutation.mutateAsync(payload);
                                }
                            }).catch(() => {
                                void queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectState.id) });
                            });
                            return;
                        }


                        // moving card from one column to another
                        if (!destination) {
                            return;
                        }

                        const indexOfTarget = destination.cards.findIndex(
                            (card) => card.id === dropTargetData.card.id,
                        );

                        const closestEdge = extractClosestEdge(dropTargetData);

                        const finalIndex = closestEdge === 'bottom' ? indexOfTarget + 1 : indexOfTarget;

                        // remove card from home list
                        const homeCards = Array.from(home.cards);
                        homeCards.splice(cardIndexInHome, 1);

                        // insert into destination list
                        const destinationCards = Array.from(destination.cards);
                        destinationCards.splice(finalIndex, 0, dragging.card);

                        // Update the order in the database
                        const reorderedDestinationCards = destinationCards.map((card, index) => ({
                            id: String(card.id),
                            title: card.title,
                            description: card.description,
                            columnId: destination.id,
                            projectId: card.projectId,
                            order: index,
                            checklists: card.checklists,
                            totalChecklistItems: card.totalChecklistItems,
                            totalCompletedChecklistItems: card.totalCompletedChecklistItems,
                            labels: card.labels,
                            createdAt: card.createdAt,
                        }));

                        const reorderedHomeCards = homeCards.map((card, index) => ({
                            id: String(card.id),
                            title: card.title,
                            description: card.description,
                            columnId: home.id,
                            projectId: card.projectId,
                            order: index,
                            checklists: card.checklists,
                            totalChecklistItems: card.totalChecklistItems,
                            totalCompletedChecklistItems: card.totalCompletedChecklistItems,
                            labels: card.labels,
                            createdAt: card.createdAt,
                        }));

                        const columns = Array.from(projectState.columns);
                        columns[homeColumnIndex] = {
                            ...home,
                            cards: reorderedHomeCards,
                        };
                        columns[destinationColumnIndex] = {
                            ...destination,
                            cards: reorderedDestinationCards,
                        };


                        // Optimistically update UI
                        setProjectState((prev) => {
                            return {
                                ...prev,
                                columns: columns
                            } as TProject;
                        });

                        const columnPatches = [
                            {
                                id: home.id,
                                cards: reorderedHomeCards.map((card) => ({
                                    id: String(card.id),
                                    order: card.order
                                }))
                            },
                            {
                                id: destination.id,
                                cards: reorderedDestinationCards.map((card) => ({
                                    id: String(card.id),
                                    order: card.order
                                }))
                            }
                        ];

                        void boardQueueRef.current.enqueue({
                            scopeKey: projectState.id,
                            coalesceKey: `move-card-${dragging.card.id}`,
                            payload: {
                                taskId: String(dragging.card.id),
                                sourceColumnId: home.id,
                                destinationColumnId: destination.id,
                                destinationOrder: finalIndex,
                                projectId: projectState.id,
                                columnPatches
                            },
                            execute: async (payload) => {
                                await moveTaskMutation.mutateAsync(payload);
                            }
                        }).catch(() => {
                            void queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectState.id) });
                        });
                        return;
                    }

                    // dropping onto a column, but not onto a card
                    if (isColumnData(dropTargetData)) {
                        const destinationColumnIndex = projectState.columns.findIndex(
                            (column) => column.id === dropTargetData.column.id,
                        );
                        const destination = projectState.columns[destinationColumnIndex];

                        if (!destination) {
                            return;
                        }

                        // dropping on home
                        if (home === destination) {
                            const reordered = reorder({
                                list: home.cards,
                                startIndex: cardIndexInHome,
                                finishIndex: home.cards.length - 1,
                            });

                            const updated: TColumn = {
                                ...home,
                                cards: reordered,
                            };
                            const columns = Array.from(projectState.columns);
                            columns[homeColumnIndex] = updated;

                            // Optimistically update UI
                            setProjectState((prev) => {
                                return {
                                    ...prev,
                                    columns: columns
                                } as TProject;
                            });

                            // Update the order in the database
                            const taskOrders = reordered.map((card, index) => ({
                                id: String(card.id),
                                order: index
                            }));

                            void boardQueueRef.current.enqueue({
                                scopeKey: projectState.id,
                                coalesceKey: `reorder-cards-${home.id}`,
                                payload: {
                                    columnId: home.id,
                                    projectId: projectState.id,
                                    taskOrders
                                },
                                execute: async (payload) => {
                                    await reorderTasksMutation.mutateAsync(payload);
                                }
                            }).catch(() => {
                                void queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectState.id) });
                            });
                            return;
                        }

                        // remove card from home list
                        const homeCards = Array.from(home.cards);
                        homeCards.splice(cardIndexInHome, 1);

                        // insert into destination list
                        const destinationCards = Array.from(destination.cards);
                        destinationCards.splice(destination.cards.length, 0, dragging.card);

                        const reorderedDestinationCards = destinationCards.map((card, index) => ({
                            ...card,
                            columnId: destination.id,
                            order: index
                        }));

                        const reorderedHomeCards = homeCards.map((card, index) => ({
                            ...card,
                            columnId: home.id,
                            order: index
                        }));

                        const columns = Array.from(projectState.columns);
                        columns[homeColumnIndex] = {
                            ...home,
                            cards: reorderedHomeCards,
                        };
                        columns[destinationColumnIndex] = {
                            ...destination,
                            cards: reorderedDestinationCards,
                        };

                        // Optimistically update UI
                        setProjectState((prev) => {
                            return {
                                ...prev,
                                columns: columns
                            } as TProject;
                        });

                        void boardQueueRef.current.enqueue({
                            scopeKey: projectState.id,
                            coalesceKey: `move-card-${dragging.card.id}`,
                            payload: {
                                taskId: String(dragging.card.id),
                                sourceColumnId: home.id,
                                destinationColumnId: destination.id,
                                destinationOrder: destination.cards.length,
                                projectId: projectState.id,
                                columnPatches: [
                                    {
                                        id: home.id,
                                        cards: reorderedHomeCards.map((card) => ({
                                            id: String(card.id),
                                            order: card.order
                                        }))
                                    },
                                    {
                                        id: destination.id,
                                        cards: reorderedDestinationCards.map((card) => ({
                                            id: String(card.id),
                                            order: card.order
                                        }))
                                    }
                                ]
                            },
                            execute: async (payload) => {
                                await moveTaskMutation.mutateAsync(payload);
                            }
                        }).catch(() => {
                            void queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectState.id) });
                        });

                        return;
                    }
                },
            }),
            monitorForElements({
                canMonitor: isDraggingAColumn,
                onDrop({ source, location }) {
                    const dragging = source.data;
                    if (!isColumnData(dragging)) {
                        return;
                    }

                    const innerMost = location.current.dropTargets[0];

                    if (!innerMost) {
                        return;
                    }
                    const dropTargetData = innerMost.data;

                    if (!isColumnData(dropTargetData)) {
                        return;
                    }

                    const homeIndex = projectState.columns.findIndex((column) => column.id === dragging.column.id);
                    const destinationIndex = projectState.columns.findIndex(
                        (column) => column.id === dropTargetData.column.id,
                    );

                    if (homeIndex === -1 || destinationIndex === -1) {
                        return;
                    }

                    if (homeIndex === destinationIndex) {
                        return;
                    }

                    const closestEdge = extractClosestEdge(dropTargetData);

                    const reordered = reorderWithEdge({
                        axis: 'horizontal',
                        list: projectState.columns,
                        startIndex: homeIndex,
                        indexOfTarget: destinationIndex,
                        closestEdgeOfTarget: closestEdge,
                    });

                    const reorderedColumns = reordered.map((column, index) => ({
                        ...column,
                        order: index
                    }));

                    // Minimal payload for server update
                    const columnOrders = reorderedColumns.map((column) => ({
                        id: column.id,
                        order: column.order
                    }));

                    // Optimistically update UI
                    setProjectState((prev) => {
                        return {
                            ...prev,
                            columns: reorderedColumns
                        } as TProject;
                    });

                    void boardQueueRef.current.enqueue({
                        scopeKey: projectState.id,
                        coalesceKey: `reorder-columns-${projectState.id}`,
                        payload: {
                            projectId: projectState.id,
                            columnOrders
                        },
                        execute: async (payload) => {
                            await reorderColumnsMutation.mutateAsync(payload);
                        }
                    }).catch(() => {
                        void queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectState.id) });
                    });
                },
            }),
            autoScrollForElements({
                canScroll({ source }) {
                    if (!settings.isOverElementAutoScrollEnabled) {
                        return false;
                    }

                    return isDraggingACard({ source }) || isDraggingAColumn({ source });
                },
                getConfiguration: ({ source }) => ({
                    maxScrollSpeed: isDraggingAColumn({ source }) ? 'fast' : settings.boardScrollSpeed
                }),
                element,
            }),
            unsafeOverflowAutoScrollForElements({
                element,
                getConfiguration: ({ source }) => ({
                    maxScrollSpeed: isDraggingAColumn({ source }) ? 'fast' : settings.boardScrollSpeed
                }),
                canScroll({ source }) {
                    if (!settings.isOverElementAutoScrollEnabled) {
                        return false;
                    }

                    if (!settings.isOverflowScrollingEnabled) {
                        return false;
                    }

                    return isDraggingACard({ source }) || isDraggingAColumn({ source });
                },
                getOverflow() {
                    return {
                        forLeftEdge: {
                            top: 1000,
                            left: 1000,
                            bottom: 1000,
                        },
                        forRightEdge: {
                            top: 1000,
                            right: 1000,
                            bottom: 1000,
                        },
                    };
                },
            }),
        );
    }, [
        projectState,
        settings.boardScrollSpeed,
        settings.isOverElementAutoScrollEnabled,
        settings.isOverflowScrollingEnabled,
        moveTaskMutation,
        reorderTasksMutation,
        reorderColumnsMutation,
        queryClient,
        setProjectState,
    ]);


    // Panning the board
    useEffect(() => {
        let cleanupActive: CleanupFn | null = null;
        const scrollable = scrollableRef.current;

        if (!scrollable) {
            return;
        }

        invariant(scrollable);

        function begin({ startX }: { startX: number }) {
            let lastX = startX;

            const cleanupEvents = bindAll(
                window,
                [
                    {
                        type: 'pointermove',
                        listener(event) {
                            const currentX = event.clientX;
                            const diffX = lastX - currentX;

                            lastX = currentX;
                            scrollable?.scrollBy({ left: diffX });
                        },
                    },
                    // stop panning if we see any of these events
                    ...(
                        [
                            'pointercancel',
                            'pointerup',
                            'pointerdown',
                            'keydown',
                            'resize',
                            'click',
                            'visibilitychange',
                        ] as const
                    ).map((eventName) => ({ type: eventName, listener: () => cleanupEvents() })),
                ],
                // need to make sure we are not after the "pointerdown" on the scrollable
                // Also this is helpful to make sure we always hear about events from this point
                { capture: true },
            );

            cleanupActive = cleanupEvents;
        }

        const cleanupStart = bindAll(scrollable, [
            {
                type: 'pointerdown',
                listener(event) {
                    if (!(event.target instanceof HTMLElement)) {
                        return;
                    }
                    // ignore interactive elements
                    if (event.target.closest(`[${blockBoardPanningAttr}]`)) {
                        return;
                    }


                    begin({ startX: event.clientX });
                },
            },
        ]);

        return function cleanupAll() {
            cleanupStart();
            cleanupActive?.();
        };
    }, []);

    // Don't render if project data is not available
    if (!projectState) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-4">
                    <h2 className="text-xl font-medium mb-2">Loading board...</h2>
                    <p className="text-muted-foreground">Please wait while we load your project data.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between flex-shrink-0 px-4 py-3 bg-muted/50 border-b">
                    <EditableProjectTitle
                        projectId={projectState.id}
                        title={projectState.title}
                        className="text-2xl font-bold"
                    />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Board options"
                                tabIndex={0}
                            >
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive py-2.5"
                                onSelect={() => setIsCloseBoardDialogOpen(true)}
                            >
                                Close board
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* {process.env.NODE_ENV !== 'production' && ( */}
                        <div className="text-xs text-muted-foreground">
                            Queue: {boardQueueStats.pending} pending, {boardQueueStats.coalesced} coalesced
                        </div>
                    {/* )} */}

                    <AlertDialog open={isCloseBoardDialogOpen} onOpenChange={setIsCloseBoardDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Close board?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will archive the board and all its lists, cards, and checklists. You can view archived boards from the home page.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isClosingBoard}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleCloseBoard}
                                    disabled={isClosingBoard}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {isClosingBoard ? 'Closing…' : 'Close board'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                <div ref={scrollableRef} className="min-w-0 overflow-x-auto overflow-y-hidden scroll-smooth w-full flex items-start gap-4 flex-shrink-0 flex-1 px-6 py-4 snap-x snap-mandatory">

                    {projectState.columns.map((column, index) => (
                        <Column
                            key={column.id}
                            column={column}
                            onDelete={() => handleDeleteColumn(column.id)}
                            totalColumns={projectState.columns.length}
                            currentPosition={index + 1}
                        />
                    ))}

                    {isAddingList ? (
                        <NewListForm
                            newListTitle={newListTitle}
                            setNewListTitle={setNewListTitle}
                            handleAddList={handleAddList}
                            setIsAddingList={setIsAddingList}
                            isCreating={createColumnMutation.isPending}
                        />
                    ) : (
                        <AddListButton
                            onClick={() => setIsAddingList(true)}
                            disabled={createColumnMutation.isPending}
                        />
                    )}
                </div>

                {/* Fixed bottom button */}
                <div className="flex justify-center py-4 flex-shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsProjectDialogOpen(true)}
                        className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Switch Project
                    </Button>
                </div>
            </div>



            <ProjectDialog
                ref={projectDialogRef}
                open={isProjectDialogOpen}
                onOpenChange={setIsProjectDialogOpen}
                title="Switch Project"
                searchPlaceholder="Search projects..."
                createButtonText="Create"
                createInputPlaceholder="Project title"
                projects={projects.map(project => ({
                    id: project.id,
                    name: project.title
                }))}
                onProjectSelect={handleProjectSelect}
                onCreateProject={handleCreateProject}
                isLoading={isLoadingProjects || createProjectMutation.isPending}
            />
        </div>
    );
}

interface AddListButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

const AddListButton: React.FC<AddListButtonProps> = ({ onClick, disabled = false }) => {
    return (
        <div className="w-[280px] min-w-[280px] flex-shrink-0">
            <Button
                variant="outline"
                className="border-dashed border-2 h-10 w-full justify-start"
                onClick={onClick}
                disabled={disabled}
            >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add another list
            </Button>
        </div>
    );
};

interface NewListFormProps {
    newListTitle: string;
    setNewListTitle: (title: string) => void;
    handleAddList: () => void;
    setIsAddingList: (adding: boolean) => void;
    isCreating?: boolean;
}

const NewListForm: React.FC<NewListFormProps> = ({
    newListTitle,
    setNewListTitle,
    handleAddList,
    setIsAddingList,
    isCreating = false,
}) => {
    return (
        <div className="w-[280px] min-w-[280px] flex-shrink-0 bg-gray-50 text-gray-900 rounded-2xl p-4 border border-gray-200">
            <Input
                autoFocus
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="Enter list title..."
                className="mb-2"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        setIsAddingList(false);
                        handleAddList();
                    }
                    if (e.key === 'Escape') setIsAddingList(false);
                }}
                disabled={isCreating}
            />
            <div className="flex gap-1">
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddList}
                    disabled={!newListTitle.trim() || isCreating}
                >
                    Add List
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingList(false)}
                    disabled={isCreating}
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
};