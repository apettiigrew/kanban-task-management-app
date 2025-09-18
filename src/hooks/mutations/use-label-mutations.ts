import { apiRequest } from "@/lib/form-error-handler";
import { CreateLabelDTO, TLabel, UpdateLabelDTO, CreateCardLabelDTO, UpdateCardLabelDTO, TCardLabel, TLabelWithChecked } from "@/models/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { labelKeys } from "../queries/use-labels";

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

const deleteLabel = async (id: string): Promise<void> => {
    return apiRequest<void>(`/api/labels/${id}`, {
        method: 'DELETE'
    })
}

const createCardLabel = async (data: CreateCardLabelDTO): Promise<TCardLabel> => {
    return apiRequest<TCardLabel>('/api/card-labels', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}

const updateCardLabel = async (payload: UpdateCardLabelDTO): Promise<TCardLabel> => {
    return apiRequest<TCardLabel>(`/api/card-labels/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    })
}

const toggleCardLabel = async (data: { cardId: string; labelId: string }): Promise<TCardLabel> => {
    return apiRequest<TCardLabel>('/api/card-labels/toggle', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}

const deleteCardLabel = async (id: string): Promise<void> => {
    return apiRequest<void>(`/api/card-labels/${id}`, {
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
            // Always refetch after error or success to ensure server state
            queryClient.invalidateQueries({ queryKey: labelKeys.byCard(newLabel.projectId) })
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

            // Snapshot the previous value
            const previousLabels = queryClient.getQueryData<TLabel[]>(labelKeys.byProject(payload.projectId))

            // Optimistically update to the new value
            if (previousLabels) {
                const previousLabel = previousLabels.find(label => label.id === payload.id)
                if (!previousLabel) {
                    return { previousLabels, optimisticLabel: null }
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

                return { previousLabel, optimisticLabel }
            }
        },
        onError: (err, payload , context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousLabel) {
                queryClient.setQueryData(labelKeys.byProject(payload.projectId), context.previousLabel)
            }
        },
        onSettled: (data, error, payload) => {
            // Always refetch after error or success to ensure server state
            queryClient.invalidateQueries({ queryKey: labelKeys.byProject(payload.projectId) })
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

// Card Label Mutations
export const useCreateCardLabel = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createCardLabel,
        onSettled: (data, error, variables) => {
            // Invalidate card labels queries
            if (data) {
                queryClient.invalidateQueries({ queryKey: labelKeys.byCard(variables.cardId) })
            }
        },
    })
}

export const useUpdateCardLabel = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateCardLabel,
        onSettled: (data, error, variables) => {
            // Invalidate card labels queries
            if (data) {
                queryClient.invalidateQueries({ queryKey: labelKeys.byCard(data.cardId) })
            }
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
        },
    })
}

export const useDeleteCardLabel = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteCardLabel,
        onSettled: (data, error, id) => {
            // Invalidate all card labels queries since we don't know which card this belonged to
            queryClient.invalidateQueries({ queryKey: labelKeys.byCard('') })
        },
    })
}
