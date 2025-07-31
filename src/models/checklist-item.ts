export type TChecklistItem = {
    id: string;
    text: string;
    isCompleted: boolean;
    createdAt: Date;
    updatedAt: Date | null;
    checklistId: string;
    order: number;
}