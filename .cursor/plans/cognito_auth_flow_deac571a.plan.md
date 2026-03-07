---
name: Cognito Auth Flow
overview: Replace the existing bcrypt/Prisma auth with AWS Cognito SDK v3 on the server side, covering registration (with email verification), login (with httpOnly cookie session), and a two-page forgot password flow.
todos:
  - id: install-sdk
    content: Install @aws-sdk/client-cognito-identity-provider
    status: completed
  - id: env-vars
    content: Add COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, AWS_REGION to .env
    status: completed
  - id: cognito-lib
    content: Create src/lib/cognito.ts singleton client
    status: completed
  - id: validation-schemas
    content: Add confirmRegistration and resetPassword schemas to validation-schemas.ts
    status: completed
  - id: api-register
    content: Rewrite src/app/api/auth/register/route.ts to use Cognito SignUpCommand
    status: pending
  - id: api-confirm-registration
    content: Create src/app/api/auth/confirm-registration/route.ts with ConfirmSignUpCommand
    status: pending
  - id: api-login
    content: Create src/app/api/auth/login/route.ts with InitiateAuthCommand + httpOnly cookie setting
    status: pending
  - id: api-logout
    content: Create src/app/api/auth/logout/route.ts to clear auth cookies
    status: pending
  - id: api-forgot-password
    content: Create src/app/api/auth/forgot-password/route.ts with ForgotPasswordCommand
    status: pending
  - id: api-reset-password
    content: Create src/app/api/auth/reset-password/route.ts with ConfirmForgotPasswordCommand
    status: pending
  - id: verify-email-page
    content: Create /verify-email page and verify-email-form.tsx component
    status: pending
  - id: forgot-password-page
    content: Create /forgot-password page and forgot-password-form.tsx component
    status: pending
  - id: reset-password-page
    content: Create /reset-password page and reset-password-form.tsx component
    status: pending
  - id: update-login-form
    content: Add 'Forgot password?' link to login-form.tsx
    status: pending
  - id: update-register-form
    content: Update register-form.tsx onSuccess to redirect to /verify-email?email=
    status: pending
  - id: update-auth-mutations
    content: Add useConfirmRegistration, useForgotPassword, useResetPassword to use-auth-mutations.ts
    status: pending
  - id: middleware
    content: Create src/middleware.ts to protect (app) routes using accessToken cookie
    status: pending
isProject: false
---

# Cognito Authentication Flow

## Architecture Overview

```mermaid
flowchart TD
    Register["Register Page /register"] -->|"POST /api/auth/register"| CognitoSignUp["Cognito SignUp"]
    CognitoSignUp -->|"redirect + email param"| VerifyEmail["Verify Email Page /verify-email"]
    VerifyEmail -->|"POST /api/auth/confirm-registration"| CognitoConfirm["Cognito ConfirmSignUp"]
    CognitoConfirm --> Login["Login Page /login"]

    Login -->|"POST /api/auth/login"| CognitoAuth["Cognito InitiateAuth"]
    CognitoAuth -->|"set httpOnly cookies"| AppHome["App /home"]

    ForgotPw["Forgot Password /forgot-password"] -->|"POST /api/auth/forgot-password"| CognitoFP["Cognito ForgotPassword"]
    CognitoFP -->|"redirect + email param"| ResetPw["Reset Password /reset-password"]
    ResetPw -->|"POST /api/auth/reset-password"| CognitoReset["Cognito ConfirmForgotPassword"]
    CognitoReset --> Login

    Middleware["Next.js Middleware"] -->|"no auth cookie"| Login
    Middleware -->|"has auth cookie"| AppHome
```



## Packages to Install

- `@aws-sdk/client-cognito-identity-provider` — AWS SDK v3 Cognito client (server-side only)

## Environment Variables to Add (`.env`)

- `COGNITO_USER_POOL_ID` — from Serverless output `UserPoolId`
- `COGNITO_CLIENT_ID` — from Serverless output `UserPoolWebClientId`
- `AWS_REGION` — `us-east-1`

## New Files

### Infrastructure

- `src/lib/cognito.ts` — Singleton `CognitoIdentityProviderClient`, exports `cognitoClient`, `COGNITO_CLIENT_ID`, `COGNITO_USER_POOL_ID`

### API Routes

- `src/app/api/auth/register/route.ts` — **Replace** Prisma/bcrypt with Cognito `SignUpCommand`
- `src/app/api/auth/confirm-registration/route.ts` — Cognito `ConfirmSignUpCommand` (POST `{ email, code }`)
- `src/app/api/auth/login/route.ts` — Cognito `InitiateAuthCommand` (`USER_PASSWORD_AUTH`), sets three httpOnly cookies (`accessToken`, `idToken`, `refreshToken`)
- `src/app/api/auth/logout/route.ts` — Clears the three auth cookies
- `src/app/api/auth/forgot-password/route.ts` — Cognito `ForgotPasswordCommand` (POST `{ email }`)
- `src/app/api/auth/reset-password/route.ts` — Cognito `ConfirmForgotPasswordCommand` (POST `{ email, code, newPassword }`)

### Pages & Forms

- `src/app/verify-email/page.tsx` + `src/components/verify-email-form.tsx` — Reads `?email=` from URL, form for 6-digit code
- `src/app/forgot-password/page.tsx` + `src/components/forgot-password-form.tsx` — Email input, on success redirects to `/reset-password?email=`
- `src/app/reset-password/page.tsx` + `src/components/reset-password-form.tsx` — Code + new password + confirm password, on success redirects to `/login`

### Middleware

- `src/middleware.ts` — Checks for `accessToken` cookie; redirects unauthenticated requests from `/(app)` routes to `/login`, redirects authenticated users away from `/login`, `/register`, `/forgot-password`, `/reset-password`

## Modified Files

- `src/components/login-form.tsx` — Add "Forgot your password?" link pointing to `/forgot-password`
- `src/components/register-form.tsx` — Update `onSuccess` to `router.push('/verify-email?email=...')` (email passed via query param)
- `src/hooks/mutations/use-auth-mutations.ts` — Add `useConfirmRegistration`, `useForgotPassword`, `useResetPassword` mutations; update `LoginUserResponse` to remove Prisma fields
- `src/utils/validation-schemas.ts` — Add `confirmRegistration` and `resetPassword` Zod schemas; export their types

## Cookie Strategy (Login Route)

```typescript
// httpOnly, secure in production, 30-day refresh token, 1-hour access token
response.cookies.set('accessToken', tokens.AccessToken, { httpOnly: true, secure, sameSite: 'strict', maxAge: 3600 })
response.cookies.set('idToken',     tokens.IdToken,     { httpOnly: true, secure, sameSite: 'strict', maxAge: 3600 })
response.cookies.set('refreshToken',tokens.RefreshToken, { httpOnly: true, secure, sameSite: 'strict', maxAge: 60 * 60 * 24 * 30 })
```

## Cognito Error Mapping

Cognito throws named errors (`UsernameExistsException`, `CodeMismatchException`, `NotAuthorizedException`, etc.) — these will be caught and mapped to the existing `handleAPIError` / field-error response format that the forms already handle.