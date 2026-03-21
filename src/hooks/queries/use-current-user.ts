'use client'

import { apiRequest } from '@/lib/form-error-handler'
import { useQuery } from '@tanstack/react-query'

export interface CurrentUser {
  email: string
  name: string
}

export const currentUserKeys = {
  all: ['currentUser'] as const,
}

const fetchCurrentUser = async (): Promise<CurrentUser> => {
  return apiRequest<CurrentUser>('/api/auth/me')
}

export const useCurrentUser = () => {
  return useQuery({
    queryKey: currentUserKeys.all,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes — token is valid for 1 hour
    retry: false, // a 401 means the user is not signed in; don't retry
  })
}
