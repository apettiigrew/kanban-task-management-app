import { TCard } from "@/models/card";
import { TColumn } from "@/models/column";
import { TChecklist } from "@/models/checklist";
import { TChecklistItem } from "@/models/checklist-item";


export type SortType = 'newest-first' | 'oldest-first' | 'alphabetical';

const cardKey = Symbol('card');
export type TCardData = {
    [cardKey]: true;
    card: TCard;
    columnId: string;
    rect: DOMRect;
};

export function getCardData({
    card,
    rect,
    columnId,
}: Omit<TCardData, typeof cardKey> & { columnId: string }): TCardData {
    return {
        [cardKey]: true,
        rect,
        card,
        columnId,
    };
}

export function isCardData(value: Record<string | symbol, unknown>): value is TCardData {
    return Boolean(value[cardKey]);
}

/**
 * Interface representing a drag source with associated data
 */
export interface TDragSource {
    source: {
        data: Record<string | symbol, unknown>;
    };
}

export function isDraggingACard({ source }: TDragSource): boolean {
    return isCardData(source.data);
}

const cardDropTargetKey = Symbol('card-drop-target');
export type TCardDropTargetData = {
    [cardDropTargetKey]: true;
    card: TCard;
    columnId: string;
};

export function isCardDropTargetData(
    value: Record<string | symbol, unknown>,
): value is TCardDropTargetData {
    return Boolean(value[cardDropTargetKey]);
}

export function getCardDropTargetData({
    card,
    columnId,
}: Omit<TCardDropTargetData, typeof cardDropTargetKey> & {
    columnId: string;
}): TCardDropTargetData {
    return {
        [cardDropTargetKey]: true,
        card,
        columnId,
    };
}

const columnKey = Symbol('column');
export type TColumnData = {
    [columnKey]: true;
    column: TColumn;
    rect: DOMRect;
};

export function getColumnData({ column, rect }: Omit<TColumnData, typeof columnKey>): TColumnData {
    return {
        [columnKey]: true,
        column,
        rect,
    };
}

export function isColumnData(value: Record<string | symbol, unknown>): value is TColumnData {
    return Boolean(value[columnKey]);
}

export function isDraggingAColumn({
    source,
}: {
    source: { data: Record<string | symbol, unknown> };
}): boolean {
    return isColumnData(source.data);
}


export function isShallowEqual(
    obj1: Record<string, unknown>,
    obj2: Record<string, unknown>,
): boolean {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false;
    }
    return keys1.every((key1) => Object.is(obj1[key1], obj2[key1]));
}

// Checklist drag and drop data structures
const checklistKey = Symbol('checklist');
export type TChecklistData = {
    [checklistKey]: true;
    checklist: TChecklist;
    cardId: string;
    rect: DOMRect;
};

export function getChecklistData({
    checklist,
    cardId,
    rect
}: Omit<TChecklistData, typeof checklistKey>): TChecklistData {
    return {
        [checklistKey]: true,
        rect,
        checklist,
        cardId,
    };
}

export function isChecklistData(value: Record<string | symbol, unknown>): value is TChecklistData {
    return Boolean(value[checklistKey]);
}

export function isDraggingAChecklist({ source }: TDragSource): boolean {
    return isChecklistData(source.data);
}

const checklistDropTargetKey = Symbol('checklist-drop-target');
export type TChecklistDropTargetData = {
    [checklistDropTargetKey]: true;
    checklist: TChecklist;
};

export function isChecklistDropTargetData(
    value: Record<string | symbol, unknown>,
): value is TChecklistDropTargetData {
    return Boolean(value[checklistDropTargetKey]);
}

export function getChecklistDropTargetData({
    checklist,
}: Omit<TChecklistDropTargetData, typeof checklistDropTargetKey>): TChecklistDropTargetData {
    return {
        [checklistDropTargetKey]: true,
        checklist,
    };
}


const checklistItemKey = Symbol('checklist-item');
export type TChecklistItemData = {
    [checklistItemKey]: true;
    item: TChecklistItem;
    checklistId: string;
    rect: DOMRect;
};

export function getChecklistItemData({
    item,
    rect,
    checklistId,
}: Omit<TChecklistItemData, typeof checklistItemKey>): TChecklistItemData {
    return {
        [checklistItemKey]: true,
        rect,
        item,
        checklistId,
    };
}

export function isChecklistItemData(value: Record<string | symbol, unknown>): value is TChecklistItemData {
    return Boolean(value[checklistItemKey]);
}

export function isDraggingAChecklistItem({ source }: TDragSource): boolean {
    return isChecklistItemData(source.data);
}

const checklistItemDropTargetKey = Symbol('checklist-item-drop-target');
export type TChecklistItemDropTargetData = {
    [checklistItemDropTargetKey]: true;
    item: TChecklistItem;
    checklistId: string;
};

export function isChecklistItemDropTargetData(
    value: Record<string | symbol, unknown>,
): value is TChecklistItemDropTargetData {
    return Boolean(value[checklistItemDropTargetKey]);
}

export function getChecklistItemDropTargetData({
    item,
    checklistId,
}: Omit<TChecklistItemDropTargetData, typeof checklistItemDropTargetKey>): TChecklistItemDropTargetData {
    return {
        [checklistItemDropTargetKey]: true,
        item,
        checklistId,
    };
}
