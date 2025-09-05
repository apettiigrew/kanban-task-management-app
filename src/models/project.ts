import { TColumn } from "./column";

export interface CreateProjectDTO {
  title: string;
  description: string | null;
}

export interface TProject {
  id: string;
  title: string;
  description: string;
  columns: TColumn[];
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
}

