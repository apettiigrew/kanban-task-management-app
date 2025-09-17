import { TLabel } from "@/models/label";
import { CreateLabelDTO, UpdateLabelDTO } from "@/models/label"
import { apiRequest } from "@/lib/form-error-handler";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { labelKeys } from "../queries/use-labels";
import React from "react";

const createLabel = async (data: CreateLabelDTO): Promise<TLabel> => {
    return  apiRequest<TLabel>('/api/labels', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  const updateLabel = async ({ id, data }: { id: string; data: UpdateLabelDTO }): Promise<TLabel> => {
    return apiRequest<TLabel>(`/api/labels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }
  
  const deleteLabel = async (id: string): Promise<void> => {
    return apiRequest<void>(`/api/labels/${id}`, {
      method: 'DELETE'
    })
  }

  
// Mutation hooks with optimistic updates
export const useCreateLabel = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createLabel,
        onMutate: async (newLabel) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: labelKeys.byProject(newLabel.projectId) })

            // Snapshot the previous value
            const previousLabels = queryClient.getQueryData<TLabel[]>(labelKeys.byProject(newLabel.projectId))

            // Optimistically update to the new value
            const optimisticLabel: TLabel = {
                id: `temp-${Date.now()}`, // Temporary ID
                title: newLabel.title,
                color: newLabel.color,
                checked: true,
                projectId: newLabel.projectId,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            queryClient.setQueryData<TLabel[]>(
                labelKeys.byProject(newLabel.projectId),
                (old) => old ? [...old, optimisticLabel] : [optimisticLabel]
            )

            // Return a context object with the snapshotted value
            return { previousLabels, optimisticLabel }
        },
        onError: (err, newLabel, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousLabels) {
                queryClient.setQueryData(
                    labelKeys.byProject(newLabel.projectId),
                    context.previousLabels
                )
            }
        },
        onSettled: (data, error, newLabel) => {
            // Always refetch after error or success to ensure server state
            queryClient.invalidateQueries({ queryKey: labelKeys.byProject(newLabel.projectId) })
        },
    })
}

export const useUpdateLabel = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateLabel,
        onMutate: async ({ id, data }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: labelKeys.detail(id) })

            // Snapshot the previous value
            const previousLabel = queryClient.getQueryData<TLabel>(labelKeys.detail(id))

            // Optimistically update to the new value
            if (previousLabel) {
                const optimisticLabel: TLabel = {
                    ...previousLabel,
                    ...data,
                    updatedAt: new Date(),
                }

                queryClient.setQueryData<TLabel>(labelKeys.detail(id), optimisticLabel)

                // Also update in the project labels list if it exists
                const projectLabels = queryClient.getQueryData<TLabel[]>(labelKeys.byProject(previousLabel.projectId))
                if (projectLabels) {
                    const updatedProjectLabels = projectLabels.map(label =>
                        label.id === id ? optimisticLabel : label
                    )
                    queryClient.setQueryData<TLabel[]>(
                        labelKeys.byProject(previousLabel.projectId),
                        updatedProjectLabels
                    )
                }

                return { previousLabel, optimisticLabel }
            }
        },
        onError: (err, { id }, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousLabel) {
                queryClient.setQueryData(labelKeys.detail(id), context.previousLabel)

                // Also rollback in the project labels list
                const projectLabels = queryClient.getQueryData<TLabel[]>(labelKeys.byProject(context.previousLabel.projectId))
                if (projectLabels) {
                    const rolledBackProjectLabels = projectLabels.map(label =>
                        label.id === id ? context.previousLabel : label
                    )
                    queryClient.setQueryData<TLabel[]>(
                        labelKeys.byProject(context.previousLabel.projectId),
                        rolledBackProjectLabels
                    )
                }
            }
        },
        onSettled: (data, error, { id }) => {
            // Always refetch after error or success to ensure server state
            queryClient.invalidateQueries({ queryKey: labelKeys.detail(id) })

            // Also invalidate project labels if we have the label data
            if (data) {
                queryClient.invalidateQueries({ queryKey: labelKeys.byProject(data.projectId) })
            }
        },
    })
}

export const useDeleteLabel = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteLabel,
        onMutate: async (id) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: labelKeys.detail(id) })

            // Snapshot the previous value
            const previousLabel = queryClient.getQueryData<TLabel>(labelKeys.detail(id))

            // Optimistically remove the label
            queryClient.setQueryData<TLabel>(labelKeys.detail(id), undefined)

            // Also remove from project labels list if it exists
            if (previousLabel) {
                const projectLabels = queryClient.getQueryData<TLabel[]>(labelKeys.byProject(previousLabel.projectId))
                if (projectLabels) {
                    const updatedProjectLabels = projectLabels.filter(label => label.id !== id)
                    queryClient.setQueryData<TLabel[]>(
                        labelKeys.byProject(previousLabel.projectId),
                        updatedProjectLabels
                    )
                }
            }

            return { previousLabel }
        },
        onError: (err, id, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousLabel) {
                queryClient.setQueryData(labelKeys.detail(id), context.previousLabel)

                // Also rollback in the project labels list
                const projectLabels = queryClient.getQueryData<TLabel[]>(labelKeys.byProject(context.previousLabel.projectId))
                if (projectLabels) {
                    const rolledBackProjectLabels = [...projectLabels, context.previousLabel]
                    queryClient.setQueryData<TLabel[]>(
                        labelKeys.byProject(context.previousLabel.projectId),
                        rolledBackProjectLabels
                    )
                }
            }
        },
        onSettled: (data, error, id) => {
            // Always refetch after error or success to ensure server state
            queryClient.invalidateQueries({ queryKey: labelKeys.detail(id) })

            // Also invalidate all project labels lists
            queryClient.invalidateQueries({ queryKey: labelKeys.lists() })
        },
    })
}


// Utility hook for toggling label checked state
export const useToggleLabel = () => {
    const updateLabelMutation = useUpdateLabel()

    const toggleLabel = React.useCallback((id: string, currentChecked: boolean) => {
        return updateLabelMutation.mutate({
            id,
            data: { id, title: '', color: '', checked: !currentChecked }
        })
    }, [updateLabelMutation])

    return {
        toggleLabel,
        isPending: updateLabelMutation.isPending,
        error: updateLabelMutation.error,
    }
}
