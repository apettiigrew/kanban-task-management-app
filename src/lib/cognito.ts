import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider'

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID ?? ''
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID ?? ''
const AWS_REGION = process.env.AWS_REGION ?? 'us-east-1'

const globalForCognito = globalThis as unknown as {
  cognitoClient: CognitoIdentityProviderClient | undefined
}

export const cognitoClient =
  globalForCognito.cognitoClient ??
  new CognitoIdentityProviderClient({ region: AWS_REGION })

if (process.env.NODE_ENV !== 'production') {
  globalForCognito.cognitoClient = cognitoClient
}

export { COGNITO_CLIENT_ID, COGNITO_USER_POOL_ID }
