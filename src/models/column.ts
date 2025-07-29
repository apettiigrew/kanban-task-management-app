import { TCard } from "./card";

export type TColumn = {
    id: string;
    title: string;
    cards: TCard[];
    createdAt: Date;
    updatedAt: Date;
    order: number;
    projectId: string;
};
