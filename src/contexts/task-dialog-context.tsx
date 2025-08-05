"use client"

import { TCard } from '@/models/card';
import { TaskEditModal } from '@/components/tasks/task-edit-modal';
import { TaskDeleteDialog } from '@/components/tasks/task-delete-dialog';
import { RenderIf } from '@/utils/render-if';
import { createContext, useContext, useState, ReactNode } from 'react';

interface TaskDialogContextType {
  isEditModalOpen: boolean;
  editCard: TCard | null;
  editColumnTitle: string;

  isDeleteModalOpen: boolean;
  deleteCard: TCard | null;
  
  openEditModal: (card: TCard, columnTitle: string) => void;
  closeEditModal: () => void;
  openDeleteModal: (card: TCard) => void;
  closeDeleteModal: () => void;
}

const TaskDialogContext = createContext<TaskDialogContextType | undefined>(undefined);

interface TaskDialogProviderProps {
  children: ReactNode;
}

export function TaskDialogProvider({ children }: TaskDialogProviderProps) {
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCard, setEditCard] = useState<TCard | null>(null);
  const [editColumnTitle, setEditColumnTitle] = useState('');
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteCard, setDeleteCard] = useState<TCard | null>(null);

  const openEditModal = (card: TCard, columnTitle: string) => {
    setEditCard(card);
    setEditColumnTitle(columnTitle);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditCard(null);
    setEditColumnTitle('');
  };

  const openDeleteModal = (card: TCard) => {
    setDeleteCard(card);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteCard(null);
  };

  const value: TaskDialogContextType = {
    isEditModalOpen,
    editCard,
    editColumnTitle,
    isDeleteModalOpen,
    deleteCard,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
  };

  return (
    <TaskDialogContext.Provider value={value}>
      {children}
      
      {/* Render modals once at the provider level */}
      <RenderIf condition={isEditModalOpen && editCard !== null}>
        <TaskEditModal
          card={editCard!}
          columnTitle={editColumnTitle}
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
        />
      </RenderIf>

      <RenderIf condition={isDeleteModalOpen && deleteCard !== null}>
        <TaskDeleteDialog
          card={deleteCard!}
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onDeleted={closeDeleteModal}
        />
      </RenderIf>
    </TaskDialogContext.Provider>
  );
}

export function useTaskDialog() {
  const context = useContext(TaskDialogContext);
  if (context === undefined) {
    throw new Error('useTaskDialog must be used within a TaskDialogProvider');
  }
  return context;
}