import { TChecklist } from "./checklist";
import { TLabelWithChecked } from "./label";

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
    labels?: TLabelWithChecked[];
    createdAt: Date;
};
