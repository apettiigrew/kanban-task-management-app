import { ChecklistItemShadow } from '@/components/ui/checklist-item-shadow';
import { Input } from '@/components/ui/input';
import { TChecklistItem } from '@/models/checklist-item';
import {
    getChecklistItemData,
    getChecklistItemDropTargetData,
    isChecklistItemData,
    isDraggingAChecklistItem,
    isShallowEqual
} from '@/utils/data';
import { cc, classIf } from '@/utils/style-utils';
import {
    attachClosestEdge,
    extractClosestEdge,
    type Edge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
    draggable,
    dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { Square, SquareCheck, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChecklistState } from '../checklist/checklist';

const innerStyles: { [Key in ChecklistItemState['type']]?: string } = {
    idle: 'hover:cursor-grab',
    'is-dragging': 'opacity-50',
  };
  
  const outerStyles: { [Key in ChecklistItemState['type']]?: string } = {
    'is-dragging-and-left-self': 'hidden',
  };


type ChecklistItemState =
    | { type: 'idle' }
    | { type: 'preview'; container: HTMLElement; rect: DOMRect }
    | { type: 'dragging' }
    | { type: 'is-dragging' }
    | { type: 'is-dragging-and-left-self' }
    | { type: 'is-over'; dragging: DOMRect; closestEdge: Edge };

interface ChecklistListItemProps {
    item: TChecklistItem;
    checklistId: string;
    isEditing: boolean;
    editedText: string;
    onToggle: () => void;
    onDelete: () => void;
    onTextClick: () => void;
    onTextSave: () => void;
    onTextCancel: () => void;
    onEditedTextChange: (text: string) => void;
}

export function ChecklistListItem(props: ChecklistListItemProps) {
    const {
        item,
        checklistId,
        isEditing,
        editedText,
        onToggle,
        onDelete,
        onTextClick,
        onTextSave,
        onTextCancel,
        onEditedTextChange,
    } = props;

    const [itemState, setItemState] = useState<ChecklistItemState>({ type: 'idle' });
    const outerRef = useRef<HTMLDivElement | null>(null);
    const innerRef = useRef<HTMLDivElement | null>(null);

    // Create checklist item object for drag and drop
    const checklistItem: TChecklistItem = useMemo(() => ({
        id: item.id,
        text: item.text,
        isCompleted: item.isCompleted,
        checklistId: checklistId,
        order: 0, // Will be set dynamically during drag
        createdAt: new Date(),
        updatedAt: null
    }), [item.id, item.text, item.isCompleted, checklistId]);

    useEffect(() => {
        const outer = outerRef.current;
        const inner = innerRef.current;
        if (!inner || !outer) return;

        return combine(
            draggable({
                element: inner,
                getInitialData: ({ element }) =>
                    getChecklistItemData({
                        item: checklistItem,
                        rect: element.getBoundingClientRect(),
                        checklistId: checklistId
                    }),
                onDragStart: () => setItemState({ type: 'is-dragging' }),
                onDrop: () => setItemState({ type: 'idle' }),
            }),
            dropTargetForElements({
                element: outer,
                getIsSticky: () => true,
                canDrop: isDraggingAChecklistItem,
                getData: ({ element, input }) =>
                    attachClosestEdge(getChecklistItemDropTargetData({
                        item: checklistItem,
                        checklistId: checklistId
                    }), {
                        element,
                        input,
                        allowedEdges: ['top', 'bottom'],
                      }),
                onDragEnter({ source, self }) {
                    if (!isChecklistItemData(source.data) || source.data.item.id === checklistItem.id) return;
                    const closestEdge = extractClosestEdge(self.data);
                    if (!closestEdge) return;
                    setItemState({ type: 'is-over', dragging: source.data.rect, closestEdge });
                },
                onDrag({ source, self }) {
                    if (!isChecklistItemData(source.data) || source.data.item.id === checklistItem.id) return;
                    const closestEdge = extractClosestEdge(self.data);
                    if (!closestEdge) return;
                    const proposed: ChecklistItemState = { type: 'is-over', dragging: source.data.rect, closestEdge };
                    setItemState((current) => (isShallowEqual(proposed as Record<string, unknown>, current as Record<string, unknown>) ? current : proposed));
                },
                onDragLeave({ source }) {
                    if (!isChecklistItemData(source.data)) return;
                    setItemState(
                      source.data.item.id === checklistItem.id
                        ? { type: 'is-dragging-and-left-self' }
                        : { type: 'idle' }
                    );
                    },
                onDrop: () => setItemState({ type: 'idle' }),
            })
        );
    }, [checklistItem, checklistId]);

  

    return (
        <>
            {itemState.type === 'is-over' && itemState.closestEdge === 'top' && (
                <ChecklistItemShadow dragging={itemState.dragging} />
            )}

            <div
                ref={outerRef}
                className={cc(
                    outerStyles[itemState.type],
                    classIf(itemState.type === 'is-dragging', 'opacity-50')
                  )}
                >
                <div
                    ref={innerRef}
                    className={cc(
                        "flex items-center gap-2 hover:bg-muted/50 p-2 rounded-md group transition-colors",
                        'active:cursor-grabbing',
                        innerStyles[itemState.type],
                        itemState.type === 'is-dragging' ? 'opacity-50 shadow-none' : ''
                    )}
                >
                    <button
                        onClick={onToggle}
                        className="flex-shrink-0 transition-colors">
                        {item.isCompleted ? (
                            <SquareCheck className="h-4 w-4 text-primary" />
                        ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                    </button>
                    {isEditing ? (
                        <Input
                            type="text"
                            value={editedText}
                            onChange={(e) => onEditedTextChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onTextSave();
                                } else if (e.key === 'Escape') {
                                    onTextCancel();
                                }
                            }}
                            onBlur={onTextSave}
                            autoFocus
                            className="flex-1 h-8 text-sm"
                        />
                    ) : (
                        <p
                            className={`flex-1 cursor-pointer px-2 py-1 rounded transition-colors ${item.isCompleted ? 'line-through text-muted-foreground' : ''}`}
                            onClick={onTextClick}
                        >
                            {item.text}
                        </p>
                    )}
                    <button
                        onClick={onDelete}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                </div>
            </div>

            {itemState.type === 'is-over' && itemState.closestEdge === 'bottom' && (
                <ChecklistItemShadow dragging={itemState.dragging} />
            )}
        </>
    );
}

interface ChecklistItemListProps {
    state: ChecklistState;
    items: TChecklistItem[];
    checklistId: string;
    editingItemId: string | null;
    editedItemTexts: Record<string, string>;
    onToggleItem: (itemId: string) => void;
    onDeleteItem?: (itemId: string) => void;
    onItemTextClick: (itemId: string, currentText: string) => void;
    onItemTextSave: (itemId: string) => void;
    onItemTextCancel: (itemId: string) => void;
    setEditedItemTexts: (value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
}

export function ChecklistItemList(props: ChecklistItemListProps) {
    const {
        state,
        items,
        checklistId,
        editingItemId,
        editedItemTexts,
        onToggleItem,
        onDeleteItem,
        onItemTextClick,
        onItemTextSave,
        onItemTextCancel,
        setEditedItemTexts
    } = props;

    if (!items || items.length === 0) {
        return state.type === 'is-checklist-item-over' ? <ChecklistItemShadow dragging={state.dragging} /> : null;
    }

    return (
        <>
            {items.map((item) => (
                <ChecklistListItem
                    key={item.id}
                    item={item}
                    checklistId={checklistId}
                    isEditing={editingItemId === item.id}
                    editedText={editedItemTexts[item.id] || item.text}
                    onToggle={() => onToggleItem(item.id)}
                    onDelete={() => onDeleteItem?.(item.id)}
                    onTextClick={() => onItemTextClick(item.id, item.text)}
                    onTextSave={() => onItemTextSave(item.id)}
                    onTextCancel={() => onItemTextCancel(item.id)}
                    onEditedTextChange={(text) => setEditedItemTexts(prev => ({
                        ...prev,
                        [item.id]: text
                    }))}
                />
            ))}
        </>
    );
}

