'use client'

import { ChecklistItemList } from '@/components/checklist-item/checklist-item';
import { Button } from '@/components/ui/button';
import { ChecklistShadow } from '@/components/ui/checklist-shadow';
import { Input } from '@/components/ui/input';
import { TChecklist } from '@/models/checklist';
import { SettingsContext } from '@/providers/settings-context';
import {
  getChecklistData,
  getChecklistDropTargetData,
  isChecklistData,
  isChecklistItemData,
  isChecklistItemDropTargetData,
  isDraggingACard,
  isDraggingAChecklist,
  isDraggingAChecklistItem,
  isShallowEqual,
  TChecklistItemData
} from '@/utils/data';
import { RenderIf } from '@/utils/render-if';
import { cc, classIf } from '@/utils/style-utils';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { DragLocationHistory } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { Plus, SquareCheck, Trash2 } from 'lucide-react';
import { useContext, useEffect, useRef, useState } from 'react';

export type ChecklistState =
  | { type: 'is-checklist-item-over'; isOverChildCard: boolean; dragging: DOMRect }
  | { type: 'idle' }
  | { type: 'preview'; container: HTMLElement; rect: DOMRect }
  | { type: 'dragging' }
  | { type: 'is-dragging' }
  | { type: 'is-dragging-and-left-self' }
  | { type: 'is-over'; dragging: DOMRect; closestEdge: Edge }
  | { type: 'is-item-over'; dragging: DOMRect };

const draggingState: ChecklistState = { type: 'idle' };

const innerStyles: { [Key in ChecklistState['type']]?: string } = {
  idle: 'hover:cursor-grab',
  'is-dragging': 'opacity-50',
};

const outerStyles: { [Key in ChecklistState['type']]?: string } = {
  'is-dragging-and-left-self': 'hidden',
};

// const stateStyles: { [Key in ChecklistState['type']]: string } = {
//   idle: '',
//   'is-checklist-item-over': 'border-2 border-emerald-500 bg-emerald-50 shadow-lg scale-[1.02] transition-all',
//   'is-dragging': 'opacity-60 rotate-2 shadow-2xl transition-all',
// };

export interface ChecklistProps {
  checklist: TChecklist;
  cardId: string
  onAddItem?: (item: string) => void
  onDeleteItem?: (itemId: string) => void
  onToggleItem?: (itemId: string) => void
  onUpdateTitle?: (newTitle: string) => void
  onUpdateItemText?: (itemId: string, newText: string) => void
  onDelete?: () => void
  className?: string
}

export function Checklist(props: ChecklistProps) {
  const {
    checklist,
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
  const [editedTitle, setEditedTitle] = useState(checklist.title);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedItemTexts, setEditedItemTexts] = useState<Record<string, string>>({});
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const { settings } = useContext(SettingsContext);
  const completedItems = checklist.items.filter(item => item.isCompleted).length;
  const progress = checklist.items.length > 0 ? Math.round((completedItems / checklist.items.length) * 100) : 0;
  const scrollableRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    const scrollable = scrollableRef.current;
    if (!inner || !outer || !scrollable) return;


    function setIsChecklistItemOver({ data, location }: { data: TChecklistItemData; location: DragLocationHistory }) {
      const innerMost = location.current.dropTargets[0];
      const isOverChildCard = Boolean(innerMost && isChecklistItemDropTargetData(innerMost.data));

      const proposed: ChecklistState = {
        type: 'is-checklist-item-over',
        dragging: data.rect,
        isOverChildCard,
      };
      setChecklistState((current) => (isShallowEqual(proposed, current) ? current : proposed));
    }

    return combine(
      draggable({
        element: inner,
        getInitialData: ({ element }) =>
          getChecklistData({ checklist, cardId: cardId, rect: element.getBoundingClientRect() }),
        onDragStart: () => setChecklistState({ type: 'is-dragging' }),
        onDrop: () => setChecklistState({ type: 'idle' }),
      }),
      dropTargetForElements({
        element: outer,
        getData: ({ element, input }) =>
          attachClosestEdge(getChecklistDropTargetData({ checklist }), {
            element,
            input,
            allowedEdges: ['top', 'bottom'],
          }),
        canDrop: ({ source }) => isDraggingAChecklist({ source }) || isDraggingAChecklistItem({ source }),
        getIsSticky: () => true,
        onDragStart: ({ source, location }) => isChecklistItemData(source.data) && setIsChecklistItemOver({ data: source.data, location }),
        onDragEnter({ source, self, location }) {
          if (isChecklistItemData(source.data)) return setIsChecklistItemOver({ data: source.data, location });
          if (!isChecklistData(source.data) || source.data.checklist.id === checklist.id) return;
          const closestEdge = extractClosestEdge(self.data);
          if (!closestEdge) return;
          setChecklistState({ type: 'is-over', dragging: source.data.rect, closestEdge });
        },
        onDropTargetChange: ({ source, location }) => isChecklistItemData(source.data) && setIsChecklistItemOver({ data: source.data, location }),
        onDragLeave: ({ source }) => !isChecklistData(source.data) || source.data.checklist.id !== checklist.id ? setChecklistState({ type: 'idle' }) : undefined,
        // onDragLeave({ source }) {
        //   if (!isChecklistData(source.data)) return;
        //   setChecklistState(
        //     source.data.checklist.id === checklist.id
        //       ? { type: 'is-dragging-and-left-self' }
        //       : { type: 'idle' }
        //   );
        // },
        onDrag({ source, self }) {
          if (!isChecklistData(source.data) || source.data.checklist.id === checklist.id) return;
          const closestEdge = extractClosestEdge(self.data);
          if (!closestEdge) return;
          const proposed: ChecklistState = { type: 'is-over', dragging: source.data.rect, closestEdge };
          setChecklistState((current) => (isShallowEqual(proposed, current) ? current : proposed));
        },
        onDrop: () => setChecklistState({ type: 'idle' }),
        
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
      setEditedTitle(checklist.title);
      setIsEditingTitle(false);
      return;
    }

    // Only update if title actually changed
    if (trimmedTitle !== checklist.title && onUpdateTitle) {
      onUpdateTitle(trimmedTitle);
    }

    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(checklist.title);
    setIsEditingTitle(false);
  };

  const handleTitleClick = () => {
    setEditedTitle(checklist.title);
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
    const originalItem = checklist.items.find(item => item.id === itemId);

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
    const originalItem = checklist.items.find(item => item.id === itemId);
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

      <div
        ref={outerRef}
        className={cc(
          outerStyles[checklistState.type],
          classIf(checklistState.type === 'is-dragging', 'opacity-50')
        )}>
        <div
          data-test-id={checklist.id}
          ref={innerRef}
          className={cc(
            `flex flex-col justify-items-start p-3 gap-3 border rounded-lg bg-card transition-all duration-200 ease-in-out cursor-pointer`,
            'active:cursor-grabbing',
            innerStyles[checklistState.type],
            classIf(checklistState.type === 'is-dragging', 'opacity-50 shadow-none'),
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
                    handleTitleSave();
                  } else if (e.key === 'Escape') {
                    handleTitleCancel();
                  }
                }}
                onBlur={handleTitleSave}
                autoFocus
                className="flex-1 h-8 text-sm font-medium"
              />
            ) : (
              <p
                className="flex-1 font-medium cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                onClick={handleTitleClick}
              >
                {checklist.title}
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

          <div ref={scrollableRef} className="flex flex-col gap-2 w-full">
            {/* Render existing items */}
            <ChecklistItemList
              state={checklistState}
              items={checklist.items}
              checklistId={checklist.id}
              editingItemId={editingItemId}
              editedItemTexts={editedItemTexts}
              onToggleItem={handleToggleItem}
              onDeleteItem={onDeleteItem}
              onItemTextClick={handleItemTextClick}
              onItemTextSave={handleItemTextSave}
              onItemTextCancel={handleItemTextCancel}
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
                      handleAddItem();
                    } else if (e.key === 'Escape') {
                      handleCancelAdd();
                    }
                  }}
                  autoFocus
                  className="w-full"
                />
                <div className="flex items-start gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAddItem}
                    disabled={!newItemText.trim()}
                    className="flex-shrink-0"
                  >
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelAdd}
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

      {checklistState.type === 'is-over' && checklistState.closestEdge === 'bottom' && (
        <ChecklistShadow dragging={checklistState.dragging} />
      )}
    </>
  );
}

