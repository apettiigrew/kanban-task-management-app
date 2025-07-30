import { TChecklist } from "./checklist";

export type TCard = {
    id: string;
    title: string;
    description: string;
    columnId: string;
    order: number;
    projectId: string;
    checklists: TChecklist[];
    totalChecklistItems?: number;
    totalCompletedChecklistItems?: number;
};
