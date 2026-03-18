'use client'

import { apiRequest } from '@/lib/form-error-handler'
import { useMutation } from '@tanstack/react-query'

// ─── Register ────────────────────────────────────────────────────────────────

interface RegisterUserData {
  email: string
  password: string
}

interface RegisterUserResponse {
  email: string
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

// ─── Confirm Registration ─────────────────────────────────────────────────────

interface ConfirmRegistrationData {
  email: string
  code: string
}

const confirmRegistration = async (data: ConfirmRegistrationData): Promise<null> => {
  return apiRequest<null>('/api/auth/confirm-registration', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const useConfirmRegistration = () => {
  return useMutation({
    mutationKey: ['confirmRegistration'],
    mutationFn: confirmRegistration,
  })
}

// ─── Login ────────────────────────────────────────────────────────────────────

interface LoginUserData {
  email: string
  password: string
}

interface LoginUserResponse {
  email: string
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

// ─── Logout ───────────────────────────────────────────────────────────────────

const logoutUser = async (): Promise<null> => {
  return apiRequest<null>('/api/auth/logout', {
    method: 'POST',
  })
}

export const useLogoutUser = () => {
  return useMutation({
    mutationKey: ['logoutUser'],
    mutationFn: logoutUser,
  })
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

interface ForgotPasswordData {
  email: string
}

interface ForgotPasswordResponse {
  email: string
}

const forgotPassword = async (data: ForgotPasswordData): Promise<ForgotPasswordResponse> => {
  return apiRequest<ForgotPasswordResponse>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const useForgotPassword = () => {
  return useMutation({
    mutationKey: ['forgotPassword'],
    mutationFn: forgotPassword,
  })
}

// ─── Reset Password ───────────────────────────────────────────────────────────

interface ResetPasswordData {
  email: string
  code: string
  newPassword: string
}

const resetPassword = async (data: ResetPasswordData): Promise<null> => {
  return apiRequest<null>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const useResetPassword = () => {
  return useMutation({
    mutationKey: ['resetPassword'],
    mutationFn: resetPassword,
  })
}
