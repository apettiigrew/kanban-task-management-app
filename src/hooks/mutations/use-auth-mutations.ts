'use client'

import { apiRequest } from '@/lib/form-error-handler'
import { RegisterSchema } from '@/utils/validation-schemas'
import { useMutation } from '@tanstack/react-query'

interface RegisterUserData {
    email: string
    password: string
}

interface RegisterUserResponse {
    id: string
    email: string
    createdAt: Date
}

const registerUser = async (data: RegisterUserData): Promise<RegisterUserResponse> => {
    return apiRequest<RegisterUserResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export const useRegisterUser = () => {
    return useMutation({
        mutationKey: ['registerUser'],
        mutationFn: registerUser,
    })
}

interface LoginUserData {
    email: string
    password: string
}

interface LoginUserResponse {
    id: string
    email: string
    createdAt: Date
}

const loginUser = async (data: LoginUserData): Promise<LoginUserResponse> => {
    return apiRequest<LoginUserResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export const useLoginUser = () => {
    return useMutation({
        mutationKey: ['loginUser'],
        mutationFn: loginUser,
    })
}
