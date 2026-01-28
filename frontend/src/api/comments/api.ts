import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'

// Query keys for comments
export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (doctype: string, docname: string) => [...commentKeys.lists(), doctype, docname] as const,
}

// Hook for fetching comments
export function useComments(doctype: string, docname: string | null) {
  return useQuery({
    queryKey: commentKeys.list(doctype, docname || ''),
    queryFn: () => api.getComments(doctype, docname!),
    enabled: !!docname,
    staleTime: 30000, // 30 seconds
  })
}

// Hook for adding a comment
export function useAddComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { doctype: string; docname: string; content: string }) => {
      return api.addComment(data.doctype, data.docname, data.content)
    },
    onSuccess: (_, variables) => {
      // Invalidate comments list to refetch
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.doctype, variables.docname),
      })
    },
  })
}

// Hook for deleting a comment
export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { commentName: string; doctype: string; docname: string }) => {
      return api.deleteComment(data.commentName)
    },
    onSuccess: (_, variables) => {
      // Invalidate comments list to refetch
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.doctype, variables.docname),
      })
    },
  })
}
