import { useMutation } from '@tanstack/react-query'
import { api } from '../../lib/api'

// Query keys for auth
export const authKeys = {
  all: ['auth'] as const,
}

// Hook for logout
export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      return api.logout()
    },
  })
}
