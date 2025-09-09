import { AddCardForm } from '@/components/add-card-form';
import { CardShadow, CardTask } from '@/components/card';
import { ColumnWrapper } from '@/components/column-wrapper';
import { CopyListForm } from '@/components/column/copy-list-form';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useCopyColumn, useUpdateColumn } from '@/hooks/mutations/use-column-mutations';
import { useCreateTask } from '@/hooks/mutations/use-task-mutations';
import { TCard } from '@/models/card';
import { TColumn } from '@/models/column';
import { SettingsContext } from '@/providers/settings-context';
import { getColumnData, isCardData, isColumnData, isDraggingACard, isDraggingAColumn, isShallowEqual, TCardData } from '@/utils/data';
import { cc } from '@/utils/style-utils';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';
import {
    attachClosestEdge,
    extractClosestEdge,
    type Edge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';

import { isSafari } from '@/utils/is-safari';
import { RenderIf } from '@/utils/render-if';
import {
    draggable,
    dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { Archive, ChevronRight, Copy, MoreHorizontal, Move, Plus, Trash2, Users } from 'lucide-react';
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
}
export function Column(props: ColumnProps) {
    const { column, onDelete } = props;
    const currentColumn = column;
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [columnTitle, setColumnTitle] = useState(currentColumn.title);
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [addCardPosition, setAddCardPosition] = useState<'top' | 'bottom'>('bottom');
    const [isCopyingList, setIsCopyingList] = useState(false);
    const outerFullHeightRef = useRef<HTMLDivElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const scrollableRef = useRef<HTMLDivElement | null>(null);

    const [columnState, setColumnState] = useState<TColumnState>(idle);
    const { settings } = useContext(SettingsContext);

    const createTaskMutation = useCreateTask();
    const copylistMutation = useCopyColumn();
    const updateColumnMutation = useUpdateColumn();

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
        setIsCopyingList(true);    
        copylistMutation.mutate({
            title: title,
            columnId: columnId,
            projectId: column.projectId,
        },{
            onSuccess: () => {
                setIsCopyingList(false);
            },
            onError: () => {
                setIsCopyingList(false);
            }
        });
    }, []);

    return (
        <>
            {columnState.type === 'is-column-over' && columnState.closestEdge === 'left' && (
                <ColumnShadow dragging={columnState.dragging} />
            )}
            <ColumnWrapper
                className={cc(
                    'bg-gray-50 text-gray-900 rounded-2xl p-4 border border-gray-200 max-h-[calc(100vh-160px)] flex flex-col gap-4',
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
                    isCopyingList={isCopyingList}
                />
                <div className="flex flex-col gap-3 overflow-y-auto scrollbar-thin [&:not(:hover)]:scrollbar-transparent hover:scrollbar-gray-300 flex-grow min-h-0" ref={scrollableRef}>
                    {isAddingCard && addCardPosition === 'top' ?
                        <AddCardForm
                            onAddCard={onAddCard}
                            position="top"
                            onCancel={handleCancelAddCard}
                            placeholder="top"
                        /> : null}

                    <DisplayCards columnId={column.id} cards={currentColumn.cards} state={columnState} columnTitle={columnTitle} />
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

interface ColumnHeaderProps {
    columnId: string;
    columnTitle: string;
    isEditingTitle: boolean;
    titleInputRef: React.RefObject<HTMLInputElement | null>;
    onTitleChange: (title: string) => void;
    onEditingChange: (isEditing: boolean) => void;
    onTitleSave: () => void;
    onTitleCancel: () => void;
    onDelete: () => void;
    onDisplayAddCardForm: (position: 'top' | 'bottom') => void;
    onCopyList: (title: string, columnId: string) => void;
    isCopyingList?: boolean;
}

function ColumnHeader({
    columnId,
    columnTitle,
    isEditingTitle,
    titleInputRef,
    onTitleChange,
    onEditingChange,
    onTitleSave,
    onTitleCancel,
    onDelete,
    onDisplayAddCardForm,
    onCopyList,
    isCopyingList = false
}: ColumnHeaderProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dropdownView, setDropdownView] = useState<'menu' | 'copy-form'>('menu');

    const handleCopyListClick = useCallback(() => {
        setDropdownView('copy-form');
    }, []);

    const handleCopyListCancel = useCallback(() => {
        setDropdownView('menu');
    }, []);

    const handleCopyListSubmit = useCallback((title: string) => {
        onCopyList(title, columnId);
        setDropdownView('menu');
        setIsDropdownOpen(false);
    }, [onCopyList]);

    const handleDropdownOpenChange = useCallback((open: boolean) => {
        setIsDropdownOpen(open);
        if (!open) {
            setDropdownView('menu');
        }
    }, []);

    return (
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 flex-1">
                {isEditingTitle ? (
                    <Input
                        ref={titleInputRef}
                        className="text-sm font-semibold text-gray-500"
                        value={columnTitle}
                        onChange={(e) => onTitleChange(e.target.value)}
                        onBlur={onTitleSave}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                onTitleSave();
                            } else if (e.key === 'Escape') {
                                e.preventDefault();
                                onTitleCancel();
                            }
                        }}
                        placeholder="Enter column title..."
                    />
                ) : (
                    <h2
                        onClick={() => onEditingChange(true)}
                        className="text-sm font-semibold text-black-500 cursor-pointer hover:text-gray-700 transition-colors flex-1"
                        title="Click to edit title"
                    >
                        {columnTitle}
                    </h2>
                )}
            </div>

            {!isEditingTitle && (
                <DropdownMenu open={isDropdownOpen} onOpenChange={handleDropdownOpenChange}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open column menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56"
                        onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                        {dropdownView === 'menu' ? (
                            <>
                                <DropdownMenuItem className="font-medium text-gray-600 cursor-default" onSelect={(e) => e.preventDefault()}>
                                    List actions
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsDropdownOpen(false);
                                        onDisplayAddCardForm('top');
                                    }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add card
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleCopyListClick();
                                    }}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy list
                                </DropdownMenuItem>

                                <DropdownMenuItem>
                                    <Move className="h-4 w-4 mr-2" />
                                    Move list
                                </DropdownMenuItem>

                                <DropdownMenuItem>
                                    <Move className="h-4 w-4 mr-2" />
                                    Move all cards in this list
                                </DropdownMenuItem>

                                <DropdownMenuItem>
                                    <Users className="h-4 w-4 mr-2" />
                                    Watch
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem className="text-blue-600">
                                    <div className="h-4 w-4 mr-2 bg-blue-500 rounded flex items-center justify-center">
                                        <div className="text-white text-xs font-bold">J</div>
                                    </div>
                                    Add list from Jira work items
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem className="justify-between">
                                    <span>Automation</span>
                                    <ChevronRight className="h-4 w-4" />
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive this list
                                </DropdownMenuItem>

                                <DropdownMenuItem>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive all cards in this list
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onSelect={(e) => e.preventDefault()}
                                    onClick={onDelete}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete column
                                </DropdownMenuItem>
                            </>
                        ) : (
                            <CopyListForm
                                originalTitle={columnTitle}
                                onCopyList={handleCopyListSubmit}
                                onCancel={handleCopyListCancel}
                            />
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}

interface DisplayCardProps {
    cards: TCard[];
    columnId: string;
    state: TColumnState;
    columnTitle: string;
}

function DisplayCards({ cards, columnId, state, columnTitle }: DisplayCardProps) {
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


export function ColumnShadow({ dragging }: { dragging: DOMRect }) {
    return <div className="flex-shrink-0 rounded-md bg-slate-900" style={{ height: dragging.height, width: dragging.width }} />;
}