import { CardShadow, CardTask } from '@/components/card';
import { ColumnWrapper } from '@/components/column-wrapper';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useUpdateColumn } from '@/hooks/mutations/use-column-mutations';
import { useCreateTask } from '@/hooks/mutations/use-task-mutations';
import { useOutsideClick } from '@/hooks/use-outside-click';
import { FormError } from '@/lib/form-error-handler';
import { TCard } from '@/models/card';
import { TColumn } from '@/models/column';
import { TProject } from '@/models/project';
import { SettingsContext } from '@/providers/settings-context';
import { getColumnData, isCardData, isCardDropTargetData, isColumnData, isDraggingACard, isDraggingAColumn, isShallowEqual, TCardData } from '@/utils/data';
import { cc } from '@/utils/style-utils';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';
import {
    attachClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { DragLocationHistory } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types';
import {
    draggable,
    dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { MoreHorizontal, Trash2, X } from 'lucide-react';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type TColumnState =
    | { type: 'is-card-over'; isOverChildCard: boolean; dragging: DOMRect }
    | { type: 'is-column-over' }
    | { type: 'idle' }
    | { type: 'is-dragging' };

const idle = { type: 'idle' } satisfies TColumnState;

const stateStyles: { [Key in TColumnState['type']]: string } = {
    idle: '',
    'is-card-over': 'border-2 border-emerald-500 bg-emerald-50 shadow-lg scale-[1.02] transition-all',
    'is-dragging': 'opacity-60 rotate-2 shadow-2xl transition-all',
    'is-column-over': 'border-2 border-purple-500 bg-purple-50 shadow-lg scale-[1.02] transition-all',
};

interface ColumnProps {
    column: TColumn;
    onDelete: () => void;
}
export function Column({ column, onDelete }: ColumnProps) {
    // Optimistic updates state for cards
    const [optimisticCards, setOptimisticCards] = useState<TCard[]>([]);

    const currentColumn = {
        ...column,
        cards: [...column.cards, ...optimisticCards]
    };


    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [columnTitle, setColumnTitle] = useState(currentColumn.title);
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState('');

    const outerFullHeightRef = useRef<HTMLDivElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const newCardInputRef = useRef<HTMLInputElement>(null);
    const scrollableRef = useRef<HTMLDivElement | null>(null);

    const [state, setState] = useState<TColumnState>(idle);
    const { settings } = useContext(SettingsContext);

    // Handle outside click for card creation cancellation
    const handleOutsideClick = useCallback(() => {
        if (isAddingCard && !newCardTitle.trim()) {
            setIsAddingCard(false);
            setNewCardTitle('');
        }
    }, [isAddingCard, newCardTitle]);

    const addCardRef = useOutsideClick(handleOutsideClick);

    const createTaskMutation = useCreateTask();
    const updateColumnMutation = useUpdateColumn();


    

    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    useEffect(() => {
        if (isAddingCard && newCardInputRef.current) {
            newCardInputRef.current.focus();
        }
    }, [isAddingCard]);

    useEffect(() => {
        const outer = outerFullHeightRef.current;
        const scrollable = scrollableRef.current;
        if (!outer || !scrollable) return;

        const data = getColumnData({ column });

        function setIsCardOver({ data, location }: { data: TCardData; location: DragLocationHistory }) {
            const innerMost = location.current.dropTargets[0];
            const isOverChildCard = Boolean(innerMost && isCardDropTargetData(innerMost.data));

            const proposed: TColumnState = {
                type: 'is-card-over',
                dragging: data.rect,
                isOverChildCard,
            };
            setState((current) => (isShallowEqual(proposed, current) ? current : proposed));
        }

        return combine(
            draggable({
                element: outer,
                getInitialData: () => data,
                onDragStart: () => setState({ type: 'is-dragging' }),
                onDrop: () => setState(idle),
            }),
            dropTargetForElements({
                element: outer,
                getData: ({ input, element }) => attachClosestEdge(data, { element, input, allowedEdges: ['left', 'right'] }),
                canDrop: ({ source }) => isDraggingACard({ source }) || isDraggingAColumn({ source }),
                getIsSticky: () => true,
                onDragStart: ({ source, location }) => isCardData(source.data) && setIsCardOver({ data: source.data, location }),
                onDragEnter: ({ source, location }) => {
                    if (isCardData(source.data)) return setIsCardOver({ data: source.data, location });
                    if (isColumnData(source.data) && source.data.column.id !== column.id) setState({ type: 'is-column-over' });
                },
                onDropTargetChange: ({ source, location }) => isCardData(source.data) && setIsCardOver({ data: source.data, location }),
                onDragLeave: ({ source }) => !isColumnData(source.data) || source.data.column.id !== column.id ? setState(idle) : undefined,
                onDrop: () => setState(idle),
            }),
            autoScrollForElements({
                canScroll: ({ source }) => settings.isOverElementAutoScrollEnabled && isDraggingACard({ source }),
                getConfiguration: () => ({ maxScrollSpeed: settings.columnScrollSpeed }),
                element: scrollable,
            }),
            unsafeOverflowAutoScrollForElements({
                element: scrollable,
                getConfiguration: () => ({ maxScrollSpeed: settings.columnScrollSpeed }),
                canScroll: ({ source }) =>
                    settings.isOverElementAutoScrollEnabled &&
                    settings.isOverflowScrollingEnabled &&
                    isDraggingACard({ source }),
                getOverflow: () => ({ forTopEdge: { top: 1000 }, forBottomEdge: { bottom: 1000 } }),
            })
        );
    }, [column, currentColumn.cards, optimisticCards, settings]);

    const handleTitleSave = useCallback(() => {
        const trimmedTitle = columnTitle.trim();

        if (!trimmedTitle) {
            toast.error('Column title cannot be empty');
            setColumnTitle(column.title);
            setIsEditingTitle(false);
            return;
        }

        if (trimmedTitle === column.title) {
            setIsEditingTitle(false);
            return;
        }

        setColumnTitle(trimmedTitle);
        updateColumnMutation.mutate({
            id: column.id,
            title: trimmedTitle,
            projectId: column.projectId,
        });

        setIsEditingTitle(false);
    }, [columnTitle, column.title, updateColumnMutation, column.id, column.projectId]);

    const handleTitleCancel = useCallback(() => {
        setColumnTitle(column.title);
        setIsEditingTitle(false);
    }, [column.title]);

    const handleDelete = useCallback(() => {
        onDelete();

    }, [onDelete]);

    const addCard = useCallback((columnId: string, title: string) => {
        setIsAddingCard(false);
        setNewCardTitle('');

        // Create optimistic card for immediate UI update
        const optimisticCard: TCard = {
            id: `temp-${Math.floor(Math.random() * 1000000)}`,
            title: title,
            description: '',
            columnId: columnId,
            projectId: column.projectId,
            order: currentColumn.cards.length,
            checklists: [],
            totalChecklistItems: 0,
            totalCompletedChecklistItems: 0,
        };

        // Optimistically update UI
        setOptimisticCards((prev) => [...prev, optimisticCard]);

        createTaskMutation.mutate({
            projectId: column.projectId,
            columnId: columnId,
            title: title,
            order: currentColumn.cards.length,
        }, {
            onSuccess: (data) => {
                console.log("addCard onSuccess", data);
                // Replace optimistic card with real data
                setOptimisticCards((prev) =>
                    prev.map((card) =>
                        card.id === optimisticCard.id ? {
                            id: data.id,
                            title: data.title,
                            description: data.description || '',
                            columnId: data.columnId,
                            projectId: data.projectId,
                            order: data.order,
                            checklists: [],
                            totalChecklistItems: 0,
                            totalCompletedChecklistItems: 0,
                        } : card
                    )
                );
            },
            onError: () => {
                setOptimisticCards((prev) =>
                    prev.filter((card) => card.id !== optimisticCard.id)
                );
            }
        });
    }, [column.projectId, currentColumn.cards.length, createTaskMutation, setOptimisticCards]);

    return (
        <ColumnWrapper
            className={cc(
                'bg-gray-50 text-gray-900 rounded-2xl p-4 border border-gray-200 w-[280px] min-w-[280px] max-h-[calc(100vh-160px)] flex flex-col gap-4 flex-shrink-0',
                stateStyles[state.type]
            )}
            ref={outerFullHeightRef}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 flex-1">
                    {isEditingTitle ? (
                        <Input
                            ref={titleInputRef}
                            className="text-sm font-semibold text-gray-500"
                            value={columnTitle}
                            onChange={(e) => setColumnTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleTitleSave();
                                } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    handleTitleCancel();
                                }
                            }}
                            placeholder="Enter column title..."
                        />
                    ) : (
                        <h2
                            onClick={() => setIsEditingTitle(true)}
                            className="text-sm font-semibold text-black-500 cursor-pointer hover:text-gray-700 transition-colors flex-1"
                            title="Click to edit title"
                        >
                            {columnTitle}
                        </h2>
                    )}
                </div>

                {!isEditingTitle && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open column menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="center">
                                List actions
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onSelect={(e) => e.preventDefault()}
                                onClick={handleDelete}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete column
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto scrollbar-thin [&:not(:hover)]:scrollbar-transparent hover:scrollbar-gray-300 flex-grow max-h-screen min-h-0" ref={scrollableRef}>
                <DisplayCard columnId={column.id} cards={currentColumn.cards} state={state} columnTitle={columnTitle} />
            </div>
            <div>
                {isAddingCard ? (
                    <div ref={addCardRef} className="flex flex-col gap-2">
                        <Input
                            ref={newCardInputRef}
                            className="text-sm font-medium"
                            value={newCardTitle}
                            onChange={(e) => setNewCardTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') addCard(column.id, newCardTitle.trim());
                                if (e.key === 'Escape') {
                                    setIsAddingCard(false);
                                    setNewCardTitle('');
                                }
                            }}
                            placeholder="Enter a title or paste a link"
                        />
                        <div className="flex justify-between gap-3">
                            <Button
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 text-white"
                                onClick={() => addCard(column.id, newCardTitle.trim())}>
                                Add a card
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsAddingCard(false);
                                    setNewCardTitle('');
                                }}
                                variant="ghost"
                                size="sm"
                                aria-label="Cancel adding card"
                            >
                                <X />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 text-white"
                        onClick={() => setIsAddingCard(true)}
                    >
                        Add a card
                    </Button>
                )}
            </div>
        </ColumnWrapper>
    );
}

interface DisplayCardProps {
    cards: TCard[];
    columnId: string;
    state: TColumnState;
    columnTitle: string;
}
function DisplayCard({ cards, columnId, state, columnTitle }: DisplayCardProps) {
    if (!cards || cards.length === 0) {
        return state.type === 'is-card-over' ? <CardShadow dragging={state.dragging} /> : null;
    }

    return (
        <>
            {cards.map((card) => (
                <CardTask card={card} key={card.id} columnId={columnId} columnTitle={columnTitle} />
            ))}
        </>
    );
}