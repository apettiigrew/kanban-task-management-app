import { QueryClient } from '@tanstack/react-query'

const pendingInvalidations = new Map<string, ReturnType<typeof setTimeout>>()

export const scheduleInvalidate = (
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  delayMs = 250,
) => {
  const cacheKey = JSON.stringify(queryKey)
  const existing = pendingInvalidations.get(cacheKey)
  if (existing) {
    clearTimeout(existing)
  }

  const timeout = setTimeout(() => {
    queryClient.invalidateQueries({ queryKey })
    pendingInvalidations.delete(cacheKey)
  }, delayMs)

  pendingInvalidations.set(cacheKey, timeout)
}
