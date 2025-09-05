'use client'

import { apiRequest } from '@/lib/form-error-handler'
import { TProject } from '@/models/project'
import { useMutation } from '@tanstack/react-query'

interface UpdateProjectTitleData {
  title: string
}

const updateProjectTitle = async ({ id, data }: { id: string; data: UpdateProjectTitleData }): Promise<TProject> => {
  return apiRequest<TProject>(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export const useUpdateProjectTitle = () => {

  return useMutation({
    mutationFn: updateProjectTitle,
  })
}
