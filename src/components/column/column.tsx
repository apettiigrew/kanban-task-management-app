import { AddCardForm } from '@/components/add-card-form';
import { CardShadow, Card } from '@/components/card';
import { ColumnWrapper } from '@/components/column-wrapper';
import { ColumnHeader } from '@/components/column/column-header';
import { Button } from '@/components/ui/button';
import { useCopyColumn, useMoveColumn, useRepositionColumn, useUpdateColumn, useSortCards } from '@/hooks/mutations/use-column-mutations';
import { useCreateTask, useMoveAllCards } from '@/hooks/mutations/use-task-mutations';
import { TCard } from '@/models/card';
import { TColumn } from '@/models/column';
import { SettingsContext } from '@/providers/settings-context';
import { getColumnData, isCardData, isColumnData, isDraggingACard, isDraggingAColumn, isShallowEqual, SortType, TCardData } from '@/utils/data';
import { cc } from '@/utils/style-utils';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';
import {
    attachClosestEdge,
    extractClosestEdge,
    type Edge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';

import { MoveColumn, RepositionColumn } from '@/lib/validations';
import { isSafari } from '@/utils/is-safari';
import { RenderIf } from '@/utils/render-if';
import {
    draggable,
    dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import invariant from 'tiny-invariant';

type TColumnState =
    | { type: 'is-card-over'; isOverChildCard: boolean; dragging: DOMRect }
    | { type: 'is-column-over'; dragging: DOMRect; closestEdge: Edge }
    | { type: 'idle' }
    | { type: 'preview'; container: HTMLElement; rect: DOMRect }
    | { type: 'is-dragging-and-left-self' }
    | { type: 'is-dragging' }
    | { type: 'dragging' };


const idle = { type: 'idle' } satisfies TColumnState;

const stateStyles: { [Key in TColumnState['type']]: string } = {
    idle: '',
    'is-card-over': 'border-2 border-emerald-500 bg-emerald-50 shadow-lg scale-[1.02] transition-all',
    'is-dragging': 'opacity-60 rotate-2 shadow-2xl transition-all',
    'is-column-over': 'border-2 border-purple-500 bg-purple-50 shadow-lg scale-[1.02] transition-all',
    'is-dragging-and-left-self': 'hidden',
    'preview': 'border-2 border-purple-500 bg-purple-50 shadow-lg scale-[1.02] transition-all',
    'dragging': 'opacity-60 rotate-2 shadow-2xl transition-all',
};

interface ColumnProps {
    column: TColumn;
    onDelete: () => void;
    totalColumns?: number;
    currentPosition?: number;
}
export function Column(props: ColumnProps) {
    const { column, onDelete, totalColumns = 1, currentPosition = 1 } = props;
    const currentColumn = column;
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [columnTitle, setColumnTitle] = useState(currentColumn.title);
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [addCardPosition, setAddCardPosition] = useState<'top' | 'bottom'>('bottom');
    const outerFullHeightRef = useRef<HTMLDivElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const scrollableRef = useRef<HTMLDivElement | null>(null);

    const [columnState, setColumnState] = useState<TColumnState>(idle);
    const { settings } = useContext(SettingsContext);

    const createTaskMutation = useCreateTask();
    const copylistMutation = useCopyColumn();
    const updateColumnMutation = useUpdateColumn();
    const moveColumnMutation = useMoveColumn();
    const repositionColumnMutation = useRepositionColumn();
    const moveAllCardsMutation = useMoveAllCards();
    const sortCardsMutation = useSortCards();

    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    useEffect(() => {
        const outer = outerFullHeightRef.current;
        const scrollable = scrollableRef.current;
        if (!outer || !scrollable) return;

        const data = getColumnData({ column, rect: outer.getBoundingClientRect() });

        function setIsCardOver({ data }: { data: TCardData }) {
            const proposed: TColumnState = {
                type: 'is-card-over',
                dragging: data.rect,
                isOverChildCard: false, // For empty columns, this is always false
            };
            setColumnState((current) => (isShallowEqual(proposed, current) ? current : proposed));
        }

        return combine(
            draggable({
                element: outer,
                getInitialData: () => data,
                onDragStart: () => setColumnState({ type: 'is-dragging' }),
                onDrop: () => setColumnState(idle),
                onGenerateDragPreview({ source, location, nativeSetDragImage }) {
                    const data = source.data;
                    invariant(isColumnData(data));
                    setCustomNativeDragPreview({
                        nativeSetDragImage,
                        getOffset: preserveOffsetOnSource({ element: outer, input: location.current.input }),
                        render({ container }) {
                            // Simple drag preview generation: just cloning the current element.
                            // Not using react for this.
                            const rect = outer.getBoundingClientRect();
                            const preview = outer.cloneNode(true);
                            invariant(preview instanceof HTMLElement);
                            preview.style.width = `${rect.width}px`;
                            preview.style.height = `${rect.height}px`;

                            // rotation of native drag previews does not work in safari
                            if (!isSafari()) {
                                preview.style.transform = 'rotate(4deg)';
                            }

                            container.appendChild(preview);
                        },
                    });
                },
            }),
            dropTargetForElements({
                element: outer,
                getData: ({ element, input }) =>
                    attachClosestEdge(getColumnData({ column, rect: outer.getBoundingClientRect() }), {
                        element,
                        input,
                        allowedEdges: ['left', 'right'],
                    }),
                canDrop: ({ source }) => isDraggingACard({ source }) || isDraggingAColumn({ source }),
                getIsSticky: () => true,
                onDrag({ source, self }) {
                    if (!isColumnData(source.data) || source.data.column.id === column.id) return;
                    const closestEdge = extractClosestEdge(self.data);
                    if (!closestEdge) return;
                    const proposed: TColumnState = { type: 'is-column-over', dragging: source.data.rect, closestEdge };
                    setColumnState((current) => (isShallowEqual(proposed, current) ? current : proposed));
                },
                onDragStart: ({ source }) => isCardData(source.data) && setIsCardOver({ data: source.data }),
                onDragEnter: ({ source, self }) => {
                    if (isCardData(source.data)) return setIsCardOver({ data: source.data });
                    if (isColumnData(source.data) && source.data.column.id !== column.id) {
                        const closestEdge = extractClosestEdge(self.data);
                        if (!closestEdge) return;
                        setColumnState({ type: 'is-column-over', dragging: source.data.rect, closestEdge });
                    }
                },
                onDropTargetChange: ({ source }) => isCardData(source.data) && setIsCardOver({ data: source.data }),
                onDragLeave({ source }) {
                    if (isColumnData(source.data)) {
                        setColumnState(
                            source.data.column.id === column.id
                                ? { type: 'is-dragging-and-left-self' }
                                : { type: 'idle' }
                        );
                    } else if (isCardData(source.data)) {
                        setColumnState({ type: 'idle' });
                    }
                },
                onDrop: () => setColumnState(idle),
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
                getOverflow() {
                    return {
                        forTopEdge: {
                            top: 1000,
                        },
                        forBottomEdge: {
                            bottom: 1000,
                        },
                    };
                },
            })
        );
    }, [column, currentColumn.cards, settings]);

    const handleTitleSave = useCallback(() => {
        const trimmedTitle = columnTitle.trim();

        if (!trimmedTitle) {
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

    const handleDisplayAddCardForm = useCallback((position: 'top' | 'bottom') => {
        setIsAddingCard(true);
        setAddCardPosition(position);
    }, []);

    const onAddCard = useCallback((card: { title: string, position: 'top' | 'bottom' }) => {
        const order = card.position === 'top' ? 0 : (currentColumn.cards.length + 1) - 1;

        console.log('order', order);
        createTaskMutation.mutate({
            projectId: column.projectId,
            columnId: column.id,
            title: card.title,
            order: order,
            position: card.position,
        }, {
            onError: () => {
                setIsAddingCard(true);
                setAddCardPosition(card.position);
            }
        });

        setIsAddingCard(false);
        setAddCardPosition('bottom');
    }, [column.projectId, column.id, createTaskMutation]);

    const handleCancelAddCard = useCallback(() => {
        setIsAddingCard(false);
        setAddCardPosition('bottom');
    }, [isAddingCard]);

    const handleCopyList = useCallback((title: string, columnId: string) => {
        copylistMutation.mutate({
            title: title,
            columnId: columnId,
            projectId: column.projectId,
        }, {
            onSuccess: () => {
            },
            onError: () => {
            }
        });
    }, []);

    const handleMoveList = useCallback((data: MoveColumn | RepositionColumn) => {

        if ('targetProjectId' in data) {
            // Moving to different board
            moveColumnMutation.mutate({
                ...data,
                targetProjectId: column.projectId,
                columnId: column.id
            }, {
                onSuccess: () => {
                },
                onError: (error) => {
                    console.error('Error moving column to different board:', error);
                }
            });
        } else {
            // Repositioning within same board
            repositionColumnMutation.mutate({
                ...data,
                columnId: column.id
            }, {
                onSuccess: () => {
                },
                onError: (error) => {
                    console.error('Error repositioning column:', error);
                }
            });
        }
    }, [moveColumnMutation, repositionColumnMutation]);

    const handleMoveAllCards = useCallback((data: { columnId: string; targetColumnId: string }) => {

        moveAllCardsMutation.mutate({
            sourceColumnId: data.columnId,
            targetColumnId: data.targetColumnId,
            projectId: column.projectId
        }, {
            onSuccess: () => {
            },
            onError: (error) => {
                console.error('Error moving all cards:', error);    
            }
        });
    }, [moveAllCardsMutation, column.projectId]);

    const handleSortCards = useCallback((sortType: SortType) => {
        sortCardsMutation.mutate({
            columnId: column.id,
            projectId: column.projectId,
            sortType: sortType
        });
    }, [sortCardsMutation, column.id]);

    return (
        <>
            {columnState.type === 'is-column-over' && columnState.closestEdge === 'left' && (
                <ColumnShadow dragging={columnState.dragging} />
            )}
            <ColumnWrapper
                className={cc(
                    'bg-gray-50 text-gray-900 rounded-2xl p-4 border border-gray-200 flex flex-col gap-4',
                    stateStyles[columnState.type]
                )}
                ref={outerFullHeightRef}>
                <ColumnHeader
                    columnId={column.id}
                    columnTitle={columnTitle}
                    isEditingTitle={isEditingTitle}
                    titleInputRef={titleInputRef}
                    onTitleChange={setColumnTitle}
                    onEditingChange={setIsEditingTitle}
                    onTitleSave={handleTitleSave}
                    onTitleCancel={handleTitleCancel}
                    onDelete={handleDelete}
                    onDisplayAddCardForm={handleDisplayAddCardForm}
                    onCopyList={handleCopyList}
                    onMoveList={handleMoveList}
                    onMoveAllCards={handleMoveAllCards}
                    onSortCards={handleSortCards}
                    cardCount={currentColumn.cards.length}
                    currentProjectId={column.projectId}
                    totalColumns={totalColumns}
                    currentPosition={currentPosition}
                />
                <div className="flex flex-col gap-3 overflow-y-auto scrollbar-thin [&:not(:hover)]:scrollbar-transparent hover:scrollbar-gray-300 flex-grow min-h-0" ref={scrollableRef}>
                    {isAddingCard && addCardPosition === 'top' ?
                        <AddCardForm
                            onAddCard={onAddCard}
                            position="top"
                            onCancel={handleCancelAddCard}
                            placeholder="top"
                        /> : null}

                    <DisplayCards
                        columnId={column.id}
                        cards={currentColumn.cards}
                        state={columnState}
                        columnTitle={columnTitle}
                    />
                </div>
                <div>
                    {
                        isAddingCard && addCardPosition === 'bottom' ?
                            <AddCardForm
                                onAddCard={onAddCard}
                                position="bottom"
                                onCancel={handleCancelAddCard}
                                placeholder="bottom"
                            /> :
                            <RenderIf
                                condition={!isAddingCard && addCardPosition != 'top'}
                            >
                                <Button
                                    variant="primary"
                                    onClick={() => handleDisplayAddCardForm('bottom')}>
                                    Add a card
                                </Button>
                            </RenderIf>

                    }
                </div>
            </ColumnWrapper>

            {columnState.type === 'is-column-over' && columnState.closestEdge === 'right' && (
                <ColumnShadow dragging={columnState.dragging} />
            )}
        </>
    );
}


interface DisplayCardProps {
    cards: TCard[];
    columnId: string;
    state: TColumnState;
    columnTitle: string;
    onCardReorder?: (reorderedCards: TCard[]) => void;
}

function DisplayCards({ cards, columnId, state, columnTitle }: DisplayCardProps) {
    if (!cards || cards.length === 0) {
        return state.type === 'is-card-over' ? <CardShadow dragging={state.dragging} /> : null;
    }

    return (
        <>
            {cards.map((card) => (
                <Card card={card} key={card.id} columnId={columnId} columnTitle={columnTitle} />
            ))}
        </>
    );
}

export function ColumnShadow({ dragging }: { dragging: DOMRect }) {
    return <div className="flex-shrink-0 rounded-md bg-slate-900" style={{ height: dragging.height, width: dragging.width }} />;
}