export interface Checklist {
  id: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}