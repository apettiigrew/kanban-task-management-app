import { TChecklistItem } from "./checklist-item";

export type TChecklist = {
  id: string;
  title: string;
  cardId: string
  createdAt: Date;
  updatedAt: Date | null;
  items: TChecklistItem[];
  order: number;
}

