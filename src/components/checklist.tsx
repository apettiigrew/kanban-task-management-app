'use client'

import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import React, { MutableRefObject, useEffect, useRef, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RenderIf } from '@/utils/render-if'
import { Plus, Square, SquareCheck, Trash2 } from 'lucide-react'
import {
  TChecklist,
  TChecklistItem,
  getChecklistData,
  getChecklistDropTargetData,
  getChecklistItemData,
  getChecklistItemDropTargetData,
  isChecklistData,
  isChecklistItemData,
  isDraggingAChecklist,
  isDraggingAChecklistItem,
  isShallowEqual,
} from '@/utils/data';
import { cc, classIf } from '@/utils/style-utils';

interface ChecklistItem {
  id: string
  text: string
  isCompleted: boolean
}

interface ChecklistProps {
  id: string
  title: string
  items?: ChecklistItem[]
  cardId: string
  onAddItem?: (item: string) => void
  onDeleteItem?: (itemId: string) => void
  onToggleItem?: (itemId: string) => void
  onUpdateTitle?: (newTitle: string) => void
  onUpdateItemText?: (itemId: string, newText: string) => void
  onDelete?: () => void
  className?: string
}

type ChecklistState =
  | { type: 'idle' }
  | { type: 'preview'; container: HTMLElement; rect: DOMRect }
  | { type: 'dragging' }
  | { type: 'is-dragging' }
  | { type: 'is-dragging-and-left-self' }
  | { type: 'is-over'; dragging: DOMRect; closestEdge: Edge }
  | { type: 'is-item-over'; dragging: DOMRect };

const draggingState: ChecklistState = { type: 'idle' };

export function Checklist(props: ChecklistProps) {
  const { 
    id,
    title,
    items = [], 
    cardId,
    onAddItem, 
    onDeleteItem,
    onToggleItem,
    onUpdateTitle,
    onUpdateItemText,
    onDelete, 
    className 
  } = props;
  
  const [checklistState, setChecklistState] = useState<ChecklistState>(draggingState);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedItemTexts, setEditedItemTexts] = useState<Record<string, string>>({});
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  
  const completedItems = items.filter(item => item.isCompleted).length;
  const progress = items.length > 0 ? Math.round((completedItems / items.length) * 100) : 0;

  // Create checklist object for drag and drop (memoized to prevent useEffect re-runs)
  const checklist: TChecklist = useMemo(() => ({
    id,
    title,
    cardId: '', // This should be passed from parent component
    createdAt: '',
    updatedAt: '',
    deletedAt: ''
  }), [id, title]);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!inner || !outer) return;

    return combine(
      draggable({
        element: inner,
        getInitialData: ({ element }) =>
          getChecklistData({ checklist, rect: element.getBoundingClientRect(), cardId: cardId }),
        onDragStart: () => setChecklistState({ type: 'is-dragging' }),
        onDrop: () => setChecklistState({ type: 'idle' }),
      }),
      dropTargetForElements({
        element: outer,
        getIsSticky: () => true,
        canDrop: ({ source }) => isDraggingAChecklist({ source }) || isDraggingAChecklistItem({ source }),
        getData: ({ element, input }) => {
          if (isDraggingAChecklist({ source: { data: {} } })) {
            return attachClosestEdge(getChecklistDropTargetData({ checklist }), {
              element,
              input,
              allowedEdges: ['top', 'bottom'],
            });
          } else {
            // For checklist items, provide checklist drop target data
            return getChecklistDropTargetData({ checklist });
          }
        },
        onDragEnter({ source, self }) {
          if (isChecklistData(source.data) && source.data.checklist.id !== checklist.id) {
            const closestEdge = extractClosestEdge(self.data);
            if (!closestEdge) return;
            setChecklistState({ type: 'is-over', dragging: source.data.rect, closestEdge });
          } else if (isChecklistItemData(source.data)) {
            // Visual feedback for checklist item hovering over checklist
            setChecklistState({ type: 'is-item-over', dragging: source.data.rect });
          }
        },
        onDrag({ source, self }) {
          if (isChecklistData(source.data) && source.data.checklist.id !== checklist.id) {
            const closestEdge = extractClosestEdge(self.data);
            if (!closestEdge) return;
            const proposed: ChecklistState = { type: 'is-over', dragging: source.data.rect, closestEdge };
            setChecklistState((current) => (isShallowEqual(proposed, current) ? current : proposed));
          } else if (isChecklistItemData(source.data)) {
            const proposed: ChecklistState = { type: 'is-item-over', dragging: source.data.rect };
            setChecklistState((current) => (isShallowEqual(proposed, current) ? current : proposed));
          }
        },
        onDragLeave({ source }) {
          if (isChecklistData(source.data)) {
            setChecklistState(
              source.data.checklist.id === checklist.id
                ? { type: 'is-dragging-and-left-self' }
                : { type: 'idle' }
            );
          } else if (isChecklistItemData(source.data)) {
            setChecklistState({ type: 'idle' });
          }
        },
        onDrop: () => setChecklistState({ type: 'idle' }),
      })
    );
  }, [checklist, cardId]);

  const handleAddItem = () => {
    const trimmedText = newItemText.trim();
    if (trimmedText && onAddItem) {
      onAddItem(trimmedText);
      setNewItemText('');
      setIsAddingItem(false);
    }
  };

  const handleCancelAdd = () => {
    setNewItemText('');
    setIsAddingItem(false);
  };

  const handleToggleItem = (itemId: string) => {
    if (onToggleItem) {
      onToggleItem(itemId);
    }
  };

  const handleTitleSave = () => {
    const trimmedTitle = editedTitle.trim();
    
    // Validation: prevent empty titles
    if (!trimmedTitle) {
      // Reset to original title if empty
      setEditedTitle(title);
      setIsEditingTitle(false);
      return;
    }

    // Only update if title actually changed
    if (trimmedTitle !== title && onUpdateTitle) {
      onUpdateTitle(trimmedTitle);
    }
    
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(title);
    setIsEditingTitle(false);
  };

  const handleTitleClick = () => {
    setEditedTitle(title);
    setIsEditingTitle(true);
  };

  const handleItemTextClick = (itemId: string, currentText: string) => {
    setEditingItemId(itemId);
    setEditedItemTexts(prev => ({
      ...prev,
      [itemId]: currentText
    }));
  };

  const handleItemTextSave = (itemId: string) => {
    const editedText = editedItemTexts[itemId]?.trim();
    const originalItem = items.find(item => item.id === itemId);
    
    if (!editedText) {
      // Reset to original text if empty
      if (originalItem) {
        setEditedItemTexts(prev => ({
          ...prev,
          [itemId]: originalItem.text
        }));
      }
      setEditingItemId(null);
      return;
    }

    // Only update if text actually changed
    if (editedText !== originalItem?.text && onUpdateItemText) {
      onUpdateItemText(itemId, editedText);
    }
    
    setEditingItemId(null);
  };

  const handleItemTextCancel = (itemId: string) => {
    const originalItem = items.find(item => item.id === itemId);
    if (originalItem) {
      setEditedItemTexts(prev => ({
        ...prev,
        [itemId]: originalItem.text
      }));
    }
    setEditingItemId(null);
  };

  return (
    <>
      {checklistState.type === 'is-over' && checklistState.closestEdge === 'top' && (
        <ChecklistShadow dragging={checklistState.dragging} />
      )}

      <ChecklistDisplay
        cardId={cardId}
        checklist={checklist}
        state={checklistState}
        outerRef={outerRef}
        innerRef={innerRef}
        id={id}
        title={title}
        items={items}
        progress={progress}
        isAddingItem={isAddingItem}
        newItemText={newItemText}
        isEditingTitle={isEditingTitle}
        editedTitle={editedTitle}
        editingItemId={editingItemId}
        editedItemTexts={editedItemTexts}
        onAddItem={handleAddItem}
        onCancelAdd={handleCancelAdd}
        onToggleItem={handleToggleItem}
        onDeleteItem={onDeleteItem}
        onTitleSave={handleTitleSave}
        onTitleCancel={handleTitleCancel}
        onTitleClick={handleTitleClick}
        onItemTextClick={handleItemTextClick}
        onItemTextSave={handleItemTextSave}
        onItemTextCancel={handleItemTextCancel}
        onDelete={onDelete}
        setIsAddingItem={setIsAddingItem}
        setNewItemText={setNewItemText}
        setEditedTitle={setEditedTitle}
        setEditedItemTexts={setEditedItemTexts}
        className={className}
      />

      {checklistState.type === 'is-over' && checklistState.closestEdge === 'bottom' && (
        <ChecklistShadow dragging={checklistState.dragging} />
      )}
    </>
  );
}

interface DisplayChecklistItemsProps {
  items: ChecklistItem[];
  checklistId: string;
  state: ChecklistState;
  editingItemId: string | null;
  editedItemTexts: Record<string, string>;
  onToggleItem: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onItemTextClick: (itemId: string, currentText: string) => void;
  onItemTextSave: (itemId: string) => void;
  onItemTextCancel: (itemId: string) => void;
  setEditedItemTexts: (value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
}

function DisplayChecklistItems({ 
  items, 
  checklistId, 
  state, 
  editingItemId, 
  editedItemTexts, 
  onToggleItem, 
  onDeleteItem, 
  onItemTextClick, 
  onItemTextSave, 
  onItemTextCancel, 
  setEditedItemTexts 
}: DisplayChecklistItemsProps) {
  if (!items || items.length === 0) {
    return state.type === 'is-item-over' ? <ChecklistItemShadow dragging={state.dragging} /> : null;
  }

  return (
    <>
      {items.map((item) => (
        <ChecklistItemDisplay
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

export function ChecklistShadow({ dragging }: { dragging: DOMRect }) {
  return <div className="flex-shrink-0 rounded-md bg-slate-900" style={{ height: dragging.height }} />;
}

export function ChecklistItemShadow({ dragging }: { dragging: DOMRect }) {
  return <div className="flex-shrink-0 rounded-md bg-slate-900 mx-2 my-1" style={{ height: dragging.height }} />;
}

const innerStyles: { [Key in ChecklistState['type']]?: string } = {
  idle: 'hover:cursor-grab',
  'is-dragging': 'opacity-50',
};

const outerStyles: { [Key in ChecklistState['type']]?: string } = {
  'is-dragging-and-left-self': 'hidden',
};

interface ChecklistDisplayProps {
  checklist: TChecklist;
  cardId: string;
  state: ChecklistState;
  outerRef?: MutableRefObject<HTMLDivElement | null>;
  innerRef?: MutableRefObject<HTMLDivElement | null>;
  id: string;
  title: string;
  items: ChecklistItem[];
  progress: number;
  isAddingItem: boolean;
  newItemText: string;
  isEditingTitle: boolean;
  editedTitle: string;
  editingItemId: string | null;
  editedItemTexts: Record<string, string>;
  onAddItem: () => void;
  onCancelAdd: () => void;
  onToggleItem: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onTitleSave: () => void;
  onTitleCancel: () => void;
  onTitleClick: () => void;
  onItemTextClick: (itemId: string, currentText: string) => void;
  onItemTextSave: (itemId: string) => void;
  onItemTextCancel: (itemId: string) => void;
  onDelete?: () => void;
  setIsAddingItem: (value: boolean) => void;
  setNewItemText: (value: string) => void;
  setEditedTitle: (value: string) => void;
  setEditedItemTexts: (value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  className?: string;
}

export function ChecklistDisplay(props: ChecklistDisplayProps) {
  const {
    state,
    outerRef,
    innerRef,
    id,
    title,
    items,
    progress,
    isAddingItem,
    newItemText,
    isEditingTitle,
    editedTitle,
    editingItemId,
    editedItemTexts,
    onAddItem,
    onCancelAdd,
    onToggleItem,
    onDeleteItem,
    onTitleSave,
    onTitleCancel,
    onTitleClick,
    onItemTextClick,
    onItemTextSave,
    onItemTextCancel,
    onDelete,
    setIsAddingItem,
    setNewItemText,
    setEditedTitle,
    setEditedItemTexts,
    className
  } = props;

  return (
    <div
      ref={outerRef}
      className={cc(
        outerStyles[state.type],
        classIf(state.type === 'is-dragging', 'opacity-50')
      )}
    >
      <div
        data-test-id={id}
        ref={innerRef}
        className={cc(
          `flex flex-col justify-items-start p-3 gap-3 border rounded-lg bg-card transition-all duration-200 ease-in-out cursor-pointer`,
          'active:cursor-grabbing',
          innerStyles[state.type],
          classIf(state.type === 'is-dragging', 'opacity-50 shadow-none'),
          className || ''
        )}
      >
        <div className="flex items-center gap-2">
          <SquareCheck className="h-4 w-4 flex-shrink-0" />
          {isEditingTitle ? (
                         <Input
               type="text"
               value={editedTitle}
               onChange={(e) => setEditedTitle(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                   onTitleSave();
                 } else if (e.key === 'Escape') {
                   onTitleCancel();
                 }
               }}
               onBlur={onTitleSave}
               autoFocus
               className="flex-1 h-8 text-sm font-medium"
             />
          ) : (
            <p 
              className="flex-1 font-medium cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
              onClick={onTitleClick}
            >
              {title}
            </p>
          )}
          <Trash2 
            className="h-4 w-4 flex-shrink-0 cursor-pointer hover:text-destructive transition-colors" 
            onClick={onDelete} 
          />
        </div>
        
        <div className="flex items-center gap-2 w-full">
          <span className="text-sm font-medium text-muted-foreground">{progress}%</span>
          <div className="flex-1 bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-2 w-full">
          {/* Render existing items */}
          <DisplayChecklistItems
            items={items}
            checklistId={id}
            state={state}
            editingItemId={editingItemId}
            editedItemTexts={editedItemTexts}
            onToggleItem={onToggleItem}
            onDeleteItem={onDeleteItem}
            onItemTextClick={onItemTextClick}
            onItemTextSave={onItemTextSave}
            onItemTextCancel={onItemTextCancel}
            setEditedItemTexts={setEditedItemTexts}
          />

          {/* Add new item form */}
          <RenderIf condition={isAddingItem}>
            <div className="flex flex-col gap-2 w-full">
              <Input 
                type="text" 
                placeholder="Add a checklist item" 
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onAddItem();
                  } else if (e.key === 'Escape') {
                    onCancelAdd();
                  }
                }}
                autoFocus
                className="w-full" 
              />
              <div className="flex items-start gap-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={onAddItem}
                  disabled={!newItemText.trim()}
                  className="flex-shrink-0"
                >
                  Add
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onCancelAdd}
                  className="flex-shrink-0"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </RenderIf>

          {/* Add item button */}
          <RenderIf condition={!isAddingItem}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddingItem(true)}
              className="justify-start gap-2 w-fit"
            >
              <Plus className="h-4 w-4" />
              Add an item
            </Button>
          </RenderIf>
        </div>
      </div>
    </div>
  );
}

type ChecklistItemState = 
  | { type: 'idle' }
  | { type: 'preview'; container: HTMLElement; rect: DOMRect }
  | { type: 'dragging' }
  | { type: 'is-dragging' }
  | { type: 'is-over'; dragging: DOMRect; closestEdge: Edge };

interface ChecklistItemDisplayProps {
  item: ChecklistItem;
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

export function ChecklistItemDisplay(props: ChecklistItemDisplayProps) {
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
    order: 0 // Will be set dynamically during drag
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
          setItemState({ type: 'idle' });
        },
        onDrop: () => setItemState({ type: 'idle' }),
      })
    );
  }, [checklistItem, checklistId]);

  const itemInnerStyles: { [Key in ChecklistItemState['type']]?: string } = {
    idle: 'hover:cursor-grab',
    'is-dragging': 'opacity-50',
  };

  return (
    <>
      {itemState.type === 'is-over' && itemState.closestEdge === 'top' && (
        <ChecklistItemShadow dragging={itemState.dragging} />
      )}

      <div
        ref={outerRef}
        className={cc(
          itemState.type === 'is-dragging' ? 'opacity-50' : ''
        )}
      >
        <div 
          ref={innerRef}
          className={cc(
            "flex items-center gap-2 hover:bg-muted/50 p-2 rounded-md group transition-colors",
            'active:cursor-grabbing',
            itemInnerStyles[itemState.type],
            itemState.type === 'is-dragging' ? 'opacity-50 shadow-none' : ''
          )}
        >
          <button
            onClick={onToggle}
            className="flex-shrink-0 transition-colors"
          >
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
              className={`flex-1 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors ${item.isCompleted ? 'line-through text-muted-foreground' : ''}`}
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