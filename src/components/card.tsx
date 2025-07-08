// TailwindCSS version of the CardTask component
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
import React, { MutableRefObject, useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import {
  TCard,
  getCardData,
  getCardDropTargetData,
  isCardData,
  isDraggingACard,
  isShallowEqual,
} from '@/utils/data';
import { cc, classIf } from '@/utils/style-utils';
import { TaskEditModal } from './tasks/task-edit-modal';
import { TaskDeleteDialog } from './tasks/task-delete-dialog';
import { Task } from '@/lib/validations/task';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { TextIcon } from './icons/icons';

interface CardProps {
  card: TCard;
  columnId: string;
  columnTitle: string;
}

type CardState =
  | { type: 'idle' }
  | { type: 'preview'; container: HTMLElement; rect: DOMRect }
  | { type: 'dragging' }
  | { type: 'is-dragging' }
  | { type: 'is-dragging-and-left-self' }
  | { type: 'is-over'; dragging: DOMRect; closestEdge: Edge };

const draggingState: CardState = { type: 'idle' };

export function CardTask(props: CardProps) {
  const [cardState, setCardState] = useState<CardState>(draggingState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { card, columnId, columnTitle } = props;
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cardState.type === 'is-dragging') return;
    setIsModalOpen(true);
  };

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!inner || !outer) return;

    return combine(
      draggable({
        element: inner,
        getInitialData: ({ element }) =>
          getCardData({ card, columnId, rect: element.getBoundingClientRect() }),
        onDragStart: () => setCardState({ type: 'is-dragging' }),
        onDrop: () => setCardState({ type: 'idle' }),
      }),
      dropTargetForElements({
        element: outer,
        getIsSticky: () => true,
        canDrop: isDraggingACard,
        getData: ({ element, input }) =>
          attachClosestEdge(getCardDropTargetData({ card, columnId }), {
            element,
            input,
            allowedEdges: ['top', 'bottom'],
          }),
        onDragEnter({ source, self }) {
          if (!isCardData(source.data) || source.data.card.id === card.id) return;
          const closestEdge = extractClosestEdge(self.data);
          if (!closestEdge) return;
          setCardState({ type: 'is-over', dragging: source.data.rect, closestEdge });
        },
        onDrag({ source, self }) {
          if (!isCardData(source.data) || source.data.card.id === card.id) return;
          const closestEdge = extractClosestEdge(self.data);
          if (!closestEdge) return;
          const proposed: CardState = { type: 'is-over', dragging: source.data.rect, closestEdge };
          setCardState((current) => (isShallowEqual(proposed, current) ? current : proposed));
        },
        onDragLeave({ source }) {
          if (!isCardData(source.data)) return;
          setCardState(
            source.data.card.id === card.id
              ? { type: 'is-dragging-and-left-self' }
              : { type: 'idle' }
          );
        },
        onDrop: () => setCardState({ type: 'idle' }),
      })
    );
  }, [card, columnId]);

  return (
    <>
      {cardState.type === 'is-over' && cardState.closestEdge === 'top' && (
        <CardShadow dragging={cardState.dragging} />
      )}

      <CardDisplay
        card={card}
        state={cardState}
        outerRef={outerRef}
        innerRef={innerRef}
        handleCardClick={handleCardClick}
        handleDeleteClick={() => setIsDeleteDialogOpen(true)}
      />

      {cardState.type === 'is-over' && cardState.closestEdge === 'bottom' && (
        <CardShadow dragging={cardState.dragging} />
      )}

      <TaskEditModal
        columnTitle={columnTitle}
        card={card}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <TaskDeleteDialog
        card={card}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </>
  );
}

export function CardShadow({ dragging }: { dragging: DOMRect }) {
  return <div className="flex-shrink-0 rounded-md bg-slate-900" style={{ height: dragging.height }} />;
}

const innerStyles: { [Key in CardState['type']]?: string } = {
  idle: 'hover:cursor-grab',
  'is-dragging': 'opacity-50',
};

const outerStyles: { [Key in CardState['type']]?: string } = {
  'is-dragging-and-left-self': 'hidden',
};

interface CardDisplayProps {
  card: TCard;
  state: CardState;
  outerRef?: MutableRefObject<HTMLDivElement | null>;
  innerRef?: MutableRefObject<HTMLDivElement | null>;
  handleCardClick: (e: React.MouseEvent) => void;
  handleDeleteClick: () => void;
}

export function CardDisplay({ card, state, outerRef, innerRef, handleCardClick, handleDeleteClick }: CardDisplayProps) {
  return (
    <div
      ref={outerRef}
      className={cc(
        outerStyles[state.type],
        classIf(state.type === 'is-dragging', 'opacity-50')
      )}
    >
      <div
        data-test-id={card.id}
        ref={innerRef}
        className={cc(
          'bg-white rounded-md p-4 text-gray-900 text-sm border border-gray-200 shadow-sm transition-all duration-200 ease-in-out cursor-pointer relative group',
          'hover:shadow-lg hover:border-2 hover:border-blue-900 hover:bg-blue-50 active:cursor-grabbing',
          innerStyles[state.type],
          classIf(state.type === 'is-dragging', 'opacity-50 shadow-none')
        )}
      >
                  <div className="flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 break-all overflow-hidden" onClick={handleCardClick}>
                {card.title}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Card actions"
                  >
                  <Pencil className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(e);
                  }}
                >
                  Edit card
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick();
                  }}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete card
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {card.description && card.description.trim() && (
            <div className="flex justify-start mt-2">
              <TextIcon className="h-4 w-4 text-gray-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}