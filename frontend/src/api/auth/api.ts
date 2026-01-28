import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'

// Query keys for auth
export const authKeys = {
  all: ['auth'] as const,
}

// Hook for logout
export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return api.logout()
    },
    onSuccess: () => {
      // Clear all cached data on logout to prevent stale permissions
      queryClient.clear()
    },
  })
}
