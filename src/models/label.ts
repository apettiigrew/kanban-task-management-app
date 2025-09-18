export type TLabel = {
  id: string;
  title: string;
  color: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TCardLabel = {
  id: string;
  checked: boolean;
  cardId: string;
  labelId: string;
  createdAt: Date;
  updatedAt: Date;
  label?: TLabel;
}

export type TLabelWithChecked = TLabel & {
  checked: boolean;
}

export interface CreateLabelDTO {
  title: string;
  color: string;
  cardId: string;
  projectId: string;
}

export interface UpdateLabelDTO {
  cardId: string;
  id: string;
  title: string;
  color: string;
  projectId: string;
}

export interface CreateCardLabelDTO {
  cardId: string;
  labelId: string;
  checked?: boolean;
}

export interface UpdateCardLabelDTO {
  id: string;
  checked: boolean;
}

