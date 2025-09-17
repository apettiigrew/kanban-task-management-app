export type TLabel = {
  id: string;
  title: string;
  color: string;
  checked: boolean;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLabelDTO {
  title: string;
  color: string;
  projectId: string;
}

export interface UpdateLabelDTO {
  id: string;
  title: string;
  color: string;
  checked: boolean;
  projectId: string;
}
