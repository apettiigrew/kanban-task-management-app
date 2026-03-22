import { apiRequest } from "@/lib/form-error-handler";
import { CreateLabelDTO, TLabel, UpdateLabelDTO, TCardLabel, TLabelWithChecked } from "@/models/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { labelKeys } from "../queries/use-labels";
import { projectKeys } from "../queries/use-projects";

const createLabel = async (data: CreateLabelDTO): Promise<TLabel> => {
    return apiRequest<TLabel>('/api/labels', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}

const updateLabel = async (payload: UpdateLabelDTO): Promise<TLabel> => {
    return apiRequest<TLabel>(`/api/labels/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    })
}

const deleteLabel = async ({ labelId }: { labelId: string, cardId: string, projectId: string }): Promise<void> => {
    return apiRequest<void>(`/api/labels/${labelId}`, {
        method: 'DELETE'
    })
}

const toggleCardLabel = async (data: { cardId: string; labelId: string; projectId: string }): Promise<TCardLabel> => {
    return apiRequest<TCardLabel>('/api/card-labels/toggle', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}

// Mutation hooks with optimistic updates
export const useCreateLabel = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createLabel,
        onMutate: async (newLabel) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: labelKeys.byCard(newLabel.cardId) })

            // Snapshot the previous value
            const previousLabels = queryClient.getQueryData<TLabelWithChecked[]>(labelKeys.byCard(newLabel.cardId))

            // Optimistically update to the new value
            const optimisticLabel: TLabelWithChecked = {
                id: `temp-${Date.now()}`,
                title: newLabel.title,
                color: newLabel.color,
                checked: true,
                projectId: newLabel.projectId,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            queryClient.setQueryData<TLabelWithChecked[]>(
                labelKeys.byCard(newLabel.cardId),
                (old) => old ? [...old, optimisticLabel] : [optimisticLabel]
            )

            // Return a context object with the snapshotted value
            return { previousLabels, optimisticLabel }
        },
        onError: (err, newLabel, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousLabels) {
                queryClient.setQueryData(
                    labelKeys.byCard(newLabel.cardId),
                    context.previousLabels
                )
            }
        },
        onSettled: (data, error, newLabel) => {
            // Invalidate the correct byCard cache key (was incorrectly using projectId)
            queryClient.invalidateQueries({ queryKey: labelKeys.byCard(newLabel.cardId) })

            queryClient.invalidateQueries({ queryKey: projectKeys.detail(newLabel.projectId) })
        },
    })
}

export const useUpdateLabel = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateLabel,
        onMutate: async (payload) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: labelKeys.byProject(payload.projectId) })
            if (payload.cardId) {
                await queryClient.cancelQueries({ queryKey: labelKeys.byCard(payload.cardId) })
            }

            // Snapshot the previous values
            const previousLabels = queryClient.getQueryData<TLabel[]>(labelKeys.byProject(payload.projectId))
            const previousCardLabels = payload.cardId ? queryClient.getQueryData<TLabelWithChecked[]>(labelKeys.byCard(payload.cardId)) : null

            // Optimistically update to the new value
            if (previousLabels) {
                const previousLabel = previousLabels.find(label => label.id === payload.id)
                if (!previousLabel) {
                    return { previousLabels, previousCardLabels, optimisticLabel: null }
                }

                const optimisticLabel: TLabel = {
                    ...previousLabel,
                    ...payload,
                    updatedAt: new Date(),
                }

                queryClient.setQueryData(labelKeys.byProject(payload.projectId), (oldData: TLabel[] | undefined) => {
                    if (!oldData) return oldData

                    return oldData.map(label =>
                        label.id === payload.id ? optimisticLabel : label
                    )
                })

                // Also update card-specific query if it exists
                if (payload.cardId && previousCardLabels) {
                    const optimisticCardLabel: TLabelWithChecked = {
                        ...optimisticLabel,
                        checked: previousCardLabels.find(label => label.id === payload.id)?.checked ?? false
                    }

                    queryClient.setQueryData(labelKeys.byCard(payload.cardId), (oldData: TLabelWithChecked[] | undefined) => {
                        if (!oldData) return oldData

                        return oldData.map(label =>
                            label.id === payload.id ? optimisticCardLabel : label
                        )
                    })
                }

                return { previousLabel, previousLabels, previousCardLabels, optimisticLabel }
            }
        },
        onError: (err, payload, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousLabels) {
                queryClient.setQueryData(labelKeys.byProject(payload.projectId), context.previousLabels)
            }
            if (context?.previousCardLabels && payload.cardId) {
                queryClient.setQueryData(labelKeys.byCard(payload.cardId), context.previousCardLabels)
            }
        },
        onSettled: (data, error, payload) => {
            // Guard against undefined cardId (it is optional on UpdateLabelDTO)
            if (payload.cardId) {
                queryClient.invalidateQueries({ queryKey: labelKeys.byCard(payload.cardId) })
            }

            queryClient.invalidateQueries({ queryKey: projectKeys.detail(payload.projectId) })
        },
    })
}

export const useDeleteLabel = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteLabel,
        onMutate: async (payload) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: labelKeys.byCard(payload.cardId) })

            // Snapshot the previous values
            const previousCardLabels = queryClient.getQueryData<TLabel[]>(labelKeys.byCard(payload.cardId))

            // Optimistically update to the new value
            if (previousCardLabels) {
                queryClient.setQueryData(labelKeys.byCard(payload.cardId), (oldData: TLabel[] | undefined) => {
                    if (!oldData) return oldData

                    return oldData.filter(label =>
                        label.id != payload.labelId
                    )
                })

                return { previousCardLabels }
            }
        },
        onError: (err, payload, context) => {
            if (context?.previousCardLabels) {
                queryClient.setQueryData(labelKeys.byCard(payload.cardId), context.previousCardLabels)
            }
        },
        onSettled: (data, error, payload) => {
            // Always refetch after error or success to ensure server state
            queryClient.invalidateQueries({ queryKey: labelKeys.byCard(payload.cardId) })

            // Always refetch after error or success to ensure consistency
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(payload.projectId) })
        },
    })
}

export const useToggleCardLabel = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: toggleCardLabel,
        onMutate: async (variables) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: labelKeys.byCard(variables.cardId) })

            // Snapshot the previous value
            const previousLabels = queryClient.getQueryData<TLabelWithChecked[]>(labelKeys.byCard(variables.cardId))

            // Optimistically update the checked status
            if (previousLabels) {
                const updatedLabels = previousLabels.map(label =>
                    label.id === variables.labelId
                        ? { ...label, checked: !label.checked }
                        : label
                )

                queryClient.setQueryData<TLabelWithChecked[]>(
                    labelKeys.byCard(variables.cardId),
                    updatedLabels
                )

                return { previousLabels, optimisticLabels: updatedLabels }
            }
        },
        onError: (err, variables, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousLabels) {
                queryClient.setQueryData(
                    labelKeys.byCard(variables.cardId),
                    context.previousLabels
                )
            }
        },
        onSettled: (data, error, variables) => {
            // Always refetch after error or success to ensure server state
            queryClient.invalidateQueries({ queryKey: labelKeys.byCard(variables.cardId) })

            // Always refetch after error or success to ensure consistency
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) })
        },
    })
}

