"use client"

import '@/app/board.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateColumn, useReorderColumns, useDeleteColumn } from '@/hooks/mutations/use-column-mutations';
import { useMoveTask, useReorderTasks } from '@/hooks/mutations/use-task-mutations';
import { FormError } from '@/lib/form-error-handler';
import { SettingsContext } from '@/providers/settings-context';
import { isCardData, isCardDropTargetData, isColumnData, isDraggingACard, isDraggingAColumn, ProjectWithColumnsAndTasks, TCard, TColumn } from '@/utils/data';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';
import {
    extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { reorder } from '@atlaskit/pragmatic-drag-and-drop/reorder';
import { PlusCircle } from 'lucide-react';
import { useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Column } from './column';

interface BoardProps {
    project: ProjectWithColumnsAndTasks
}

export function Board({ project }: BoardProps) {
    console.log("project", project);
    const [projectState, setProjectState] = useState(project);
    const [isAddingList, setIsAddingList] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const { settings } = useContext(SettingsContext);
    const scrollableRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setProjectState(project);
    }, [project]);

    // Create column mutation with database persistence
    const createColumnMutation = useCreateColumn({
        onSuccess: (data) => {
            setNewListTitle('');
            setIsAddingList(false);
            // Replace the optimistic column with the real one from server
            setProjectState(prev => ({
                ...prev,
                columns: prev.columns.map(col =>
                    col.id.startsWith('temp') ? data : col
                )
            }));
        },
        onError: (error: FormError) => {
            // Rollback optimistic update by removing the temporary column
            setProjectState(prev => ({
                ...prev,
                columns: prev.columns.filter(col => !col.id.startsWith('temp-'))
            }));
            toast.error(error.message || 'Failed to create column');
        },
        onFieldErrors: (errors) => {
            // Rollback optimistic update by removing the temporary column
            setProjectState(prev => ({
                ...prev,
                columns: prev.columns.filter(col => !col.id.startsWith('temp-'))
            }));
            if (errors.title) {
                toast.error(errors.title);
            }
        }
    });

    // Task mutation hooks for drag and drop functionality
    const moveTaskMutation = useMoveTask({
        onSuccess: () => {
            // invalidateByProject(project.id);
            console.log("moveTaskMutation onSuccess", projectState);
        },
        onError: (error: FormError) => {
            toast.error(error.message || 'Failed to move task');
            // Revert to previous state on error
            setProjectState(project);
        }
    });

    const reorderTasksMutation = useReorderTasks({
        onSuccess: () => {

        },
        onError: (error: FormError) => {
            toast.error(error.message || 'Failed to reorder tasks');
            // Revert to previous state on error
            setProjectState(project);
        }
    });

    const reorderColumnsMutation = useReorderColumns({
        onError: (error: FormError) => {
            toast.error(error.message || 'Failed to reorder columns');
        }
    });

    const deleteColumnMutation = useDeleteColumn({
        onSuccess: () => {
            // The optimistic update is already applied, just need to handle success
        },
        onError: (error: FormError) => {
            // Revert to previous state on error
            setProjectState(project);
            toast.error(error.message || 'Failed to delete column');
        }
    });

    const handleDeleteColumn = (columnId: string) => {
        // Optimistically update UI
        setProjectState(prev => {
            const filteredColumns = prev.columns.filter(col => col.id !== columnId);
            // Reorder remaining columns
            const reorderedColumns = filteredColumns.map((col, index) => ({
                ...col,
                order: index
            }));
            return {
                ...prev,
                columns: reorderedColumns
            };
        });

        // Make the API call
        deleteColumnMutation.mutate({
            id: columnId,
            projectId: projectState.id
        });
    };

    const handleAddList = () => {
        const trimmedTitle = newListTitle.trim();

        if (!trimmedTitle) {
            toast.error('Column title cannot be empty');
            return;
        }

        console.log("projectState.columns", projectState.columns);
        var order = 0;
        if (projectState.columns.length === 0) {
            order = 0;
        } else {
            const maxOrder = projectState.columns.length - 1;
            order = maxOrder + 1;
        }
        // Create optimistic column for immediate UI update
        const optimisticColumn: TColumn = {
            id: `temp`,
            title: trimmedTitle,
            projectId: projectState.id,
            order: order,
            createdAt: new Date(),
            updatedAt: new Date(),
            cards: [],
        };

        // Optimistically update UI
        setProjectState(prev => ({
            ...prev,
            columns: [...prev.columns, optimisticColumn]
        }));

        // Make the API call
        createColumnMutation.mutate({
            title: trimmedTitle,
            projectId: projectState.id,
            order: order
        });
    };

    useEffect(() => {
        const element = scrollableRef.current;
        if (!element) {
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
                        console.log("dropping on a card");
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
                            setProjectState(prev => ({
                                ...prev,
                                columns
                            }));

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
                            order: index
                        }));

                        const reorderedHomeCards = homeCards.map((card, index) => ({
                            id: String(card.id),
                            title: card.title,
                            description: card.description,
                            columnId: card.columnId,
                            projectId: card.projectId,
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
                        console.log("columns", columns);

                        // Optimistically update UI
                        setProjectState(prev => ({
                            ...prev,
                            columns
                        }));

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
                            setProjectState(prev => ({
                                ...prev,
                                columns
                            }));

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
                        setProjectState(prev => ({
                            ...prev,
                            columns
                        }));

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
                    setProjectState(prev => ({
                        ...prev,
                        columns: columnOrders
                    }));

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
                getConfiguration: () => ({ maxScrollSpeed: settings.boardScrollSpeed }),
                element,
            }),
            unsafeOverflowAutoScrollForElements({
                element,
                getConfiguration: () => ({ maxScrollSpeed: settings.boardScrollSpeed }),
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

    return (
        <div ref={scrollableRef} className="h-screen flex flex-col">
            <div className="px-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6 mt-6">
                    <h1 className="text-3xl font-bold">{projectState.title}</h1>
                </div>

                <div className="flex items-start gap-4 overflow-x-auto pb-4 snap-x snap-mandatory flex-1">
                    {projectState.columns.map((column) => (
                        <Column
                            key={column.id}
                            column={column}
                            onDelete={() => handleDeleteColumn(column.id)}
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
            </div>
        </div>
    );
}

interface AddListButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

export const AddListButton: React.FC<AddListButtonProps> = ({ onClick, disabled = false }) => {
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

export const NewListForm: React.FC<NewListFormProps> = ({
    newListTitle,
    setNewListTitle,
    handleAddList,
    setIsAddingList,
    isCreating = false,
}) => {
    return (
        <div className="w-[280px] min-w-[280px] flex-shrink-0 bg-muted/40 p-2 rounded-md">
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