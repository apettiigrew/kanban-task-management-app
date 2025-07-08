export interface ProjectWithColumnsAndTasks extends TProject {
    columns: TColumn[]
}
export type TChecklist = {
    id: string;
    title: string;
    cardId: string
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
}
export type TCard = {
    id: string;
    title: string;
    description: string;
    columnId: string;
    order: number;
    projectId: string;
};

export interface TProject {
    id: string;
    title: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    columns: TColumn[];
    cards: TCard[];
}

export type TColumn = {
    id: string;
    title: string;
    cards: TCard[];
    createdAt: Date;
    updatedAt: Date;
    order: number;
    projectId: string;
};

export type TBoard = {
    id: string;
    title: string;
    columns: TColumn[];
};

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
};

export function getColumnData({ column }: Omit<TColumnData, typeof columnKey>): TColumnData {
    return {
        [columnKey]: true,
        column,
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
