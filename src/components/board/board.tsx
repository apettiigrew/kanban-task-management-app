"use client"

import '@/app/board.css';
import { Column } from '@/components/column/column';
import { EditableProjectTitle } from '@/components/editable-project-title';
import { ProjectDialog, ProjectDialogRef } from '@/components/project-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateColumn, useDeleteColumn, useReorderColumns } from '@/hooks/mutations/use-column-mutations';
import { useMoveTask, useReorderTasks } from '@/hooks/mutations/use-task-mutations';
import { useCreateProject, useProjects } from '@/hooks/queries/use-projects';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
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
import { FolderOpen, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import invariant from 'tiny-invariant';

interface BoardProps {
    project: TProject
}

export function Board(props: BoardProps) {
    const { project } = props;
    const [projectState, setProjectState] = useState<TProject>(project);
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

    useEffect(() => {
        if (project) {
            setProjectState(project)
        }
    }, [project])

    const [isAddingList, setIsAddingList] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const { settings } = useContext(SettingsContext);
    const scrollableRef = useRef<HTMLDivElement>(null);

    const createColumnMutation = useCreateColumn();
    const moveTaskMutation = useMoveTask();
    const reorderTasksMutation = useReorderTasks();
    const reorderColumnsMutation = useReorderColumns();
    const deleteColumnMutation = useDeleteColumn();

    const handleProjectSelect = useCallback((selectedProject: { id: string; name: string }) => {
        if (projectState && selectedProject.id !== projectState.id) {
            router.push(`/board/${selectedProject.id}`);
        }
    }, [projectState?.id, router]);

    const handleCreateProject = useCallback((projectName: string) => {
        createProjectMutation.mutate({
            title: projectName,
            description: null
        }, {
            onSuccess: (newProject: TProject) => {
                console.log("Successfully created project", newProject)
                projectDialogRef.current?.resetForm();
                setIsProjectDialogOpen(false);
                router.push(`/board/${newProject.id}`);
            }
        });
    }, [createProjectMutation]);

    const handleDeleteColumn = useCallback((columnId: string) => {
        if (!projectState) return;

        const optimisticColumn = projectState.columns.find(col => col.id === columnId);
        const filteredColumns = projectState.columns.filter(col => col.id !== columnId);

        const reorderedColumns = filteredColumns.map((col, index) => ({
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

        // Make the API call
        deleteColumnMutation.mutate({
            id: columnId,
            projectId: projectState.id
        }, {
            onError: () => {
                // On re add the column that was deleted optimistically
                const oldColumns = [...projectState.columns]

                setProjectState((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        columns: oldColumns
                    } as TProject;
                })
            }
        });
    }, [projectState, deleteColumnMutation]);

    const handleAddList = useCallback(() => {
        if (!projectState) return;

        const trimmedTitle = newListTitle.trim();

        if (!trimmedTitle) {
            return;
        }

        var order = 0;
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
    }, [projectState, createColumnMutation, newListTitle]);

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

                            reorderTasksMutation.mutate({
                                columnId: home.id,
                                projectId: projectState.id,
                                taskOrders: reorderedCards,
                                columns
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
                            columnId: card.columnId,
                            projectId: card.projectId,
                            order: index,
                            checklists: card.checklists,
                            totalChecklistItems: card.totalChecklistItems,
                            totalCompletedChecklistItems: card.totalCompletedChecklistItems,
                            createdAt: card.createdAt,
                        }));

                        const reorderedHomeCards = homeCards.map((card, index) => ({
                            id: String(card.id),
                            title: card.title,
                            description: card.description,
                            columnId: card.columnId,
                            projectId: card.projectId,
                            order: index,
                            checklists: card.checklists,
                            totalChecklistItems: card.totalChecklistItems,
                            totalCompletedChecklistItems: card.totalCompletedChecklistItems,
                            createdAt: card.createdAt,
                        }));

                        // console.log("reorderedDestinationCards", reorderedDestinationCards)
                        // console.log("reorderedHomeCards", reorderedHomeCards)

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

                        // Move the task between columns
                        moveTaskMutation.mutate({
                            taskId: String(dragging.card.id),
                            sourceColumnId: home.id,
                            destinationColumnId: destination.id,
                            destinationOrder: finalIndex,
                            projectId: projectState.id,
                            columns: columns
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

                            reorderTasksMutation.mutate({
                                columnId: home.id,
                                projectId: projectState.id,
                                taskOrders,
                                columns
                            });
                            return;
                        }

                        // remove card from home list
                        const homeCards = Array.from(home.cards);
                        homeCards.splice(cardIndexInHome, 1);

                        // insert into destination list
                        const destinationCards = Array.from(destination.cards);
                        destinationCards.splice(destination.cards.length, 0, dragging.card);

                        const columns = Array.from(projectState.columns);
                        columns[homeColumnIndex] = {
                            ...home,
                            cards: homeCards,
                        };
                        columns[destinationColumnIndex] = {
                            ...destination,
                            cards: destinationCards,
                        };

                        // Optimistically update UI
                        setProjectState((prev) => {
                            return {
                                ...prev,
                                columns: columns
                            } as TProject;
                        });

                        // Move the task to another column
                        moveTaskMutation.mutate({
                            taskId: String(dragging.card.id),
                            sourceColumnId: home.id,
                            destinationColumnId: destination.id,
                            destinationOrder: destination.cards.length,
                            projectId: projectState.id,
                            columns
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

                    // Update the order in the database
                    const columnOrders = reordered.map((column, index) => ({
                        id: column.id,
                        title: column.title,
                        projectId: column.projectId,
                        createdAt: column.createdAt,
                        updatedAt: column.updatedAt,
                        cards: column.cards,
                        order: index
                    }));

                    // Optimistically update UI
                    setProjectState((prev) => {
                        return {
                            ...prev,
                            columns: columnOrders
                        } as TProject;
                    });

                    reorderColumnsMutation.mutate({
                        projectId: projectState.id,
                        columnOrders
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
    }, [projectState, settings.boardScrollSpeed, settings.isOverElementAutoScrollEnabled, settings.isOverflowScrollingEnabled]);


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
                <div className="flex items-center justify-between flex-shrink-0 p-4">
                    <EditableProjectTitle
                        projectId={projectState.id}
                        title={projectState.title}
                        className="text-3xl font-bold"
                    />
                </div>

                <div ref={scrollableRef} className="min-w-0 overflow-x-auto overflow-y-hidden scroll-smooth w-full flex items-start gap-4 flex-shrink-0 flex-1 px-6 pb-4 snap-x snap-mandatory">

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