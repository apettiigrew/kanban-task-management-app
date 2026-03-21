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
  isArchived: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

