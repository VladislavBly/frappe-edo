import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

// Query keys for users
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: () => [...userKeys.lists()] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (name: string) => [...userKeys.details(), name] as const,
  current: () => [...userKeys.all, 'current'] as const,
}

// Hook for fetching current user
export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: () => api.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for fetching users list
export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: () => api.getUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
