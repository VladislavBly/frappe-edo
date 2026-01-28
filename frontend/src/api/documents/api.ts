import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { EDODocument } from './types'

// Query keys for documents
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters?: {
    search?: string
    status?: string
    document_type?: string
    priority?: string
    correspondent?: string
  }) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (name: string) => [...documentKeys.details(), name] as const,
}

// Hook for fetching documents list
export function useDocuments(filters?: {
  search?: string
  status?: string
  document_type?: string
  priority?: string
  correspondent?: string
}) {
  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: () => api.getDocuments(filters),
    staleTime: 30000, // 30 seconds
  })
}

// Hook for fetching a single document
export function useDocument(name: string | null, enabled = true) {
  return useQuery({
    queryKey: documentKeys.detail(name || ''),
    queryFn: () => api.getDocument(name!),
    enabled: enabled && !!name,
    staleTime: 30000, // 30 seconds
  })
}

// Hook for updating a document
export function useUpdateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; updates: Partial<EDODocument> }) => {
      return api.updateDocument(data.name, data.updates)
    },
    onSuccess: updatedDoc => {
      // Invalidate and refetch documents list
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
      // Update the specific document in cache
      queryClient.setQueryData(documentKeys.detail(updatedDoc.name), updatedDoc)
    },
  })
}

// Hook for creating a document
export function useCreateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<EDODocument>) => {
      return api.createDocument(data)
    },
    onSuccess: () => {
      // Invalidate documents list to refetch
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })
}

// Hook for director approval
export function useDirectorApproveDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; comment?: string }) => {
      return api.directorApproveDocument(data.name, data.comment)
    },
    onSuccess: updatedDoc => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
      queryClient.setQueryData(documentKeys.detail(updatedDoc.name), updatedDoc)
    },
  })
}

// Hook for director rejection
export function useDirectorRejectDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; comment?: string }) => {
      return api.directorRejectDocument(data.name, data.comment)
    },
    onSuccess: updatedDoc => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
      queryClient.setQueryData(documentKeys.detail(updatedDoc.name), updatedDoc)
    },
  })
}

// Hook for executor signing
export function useExecutorSignDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; comment?: string }) => {
      return api.executorSignDocument(data.name, data.comment)
    },
    onSuccess: updatedDoc => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
      queryClient.setQueryData(documentKeys.detail(updatedDoc.name), updatedDoc)
    },
  })
}

// Hook for reception submit to director
export function useReceptionSubmitToDirector() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      documentName: string
      resolution?: string
      resolutionText?: string
      executor?: string
      coExecutors?: string[]
    }) => {
      return api.receptionSubmitToDirector(
        data.documentName,
        data.resolution,
        data.resolutionText,
        data.executor,
        data.coExecutors
      )
    },
    onSuccess: updatedDoc => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
      queryClient.setQueryData(documentKeys.detail(updatedDoc.name), updatedDoc)
    },
  })
}

// Hook for checking edit permission
export function useCanEditDocument() {
  return useQuery({
    queryKey: [...documentKeys.all, 'canEdit'] as const,
    queryFn: () => api.canEditDocument(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for checking director approve permission
export function useCanDirectorApprove() {
  return useQuery({
    queryKey: [...documentKeys.all, 'canDirectorApprove'] as const,
    queryFn: () => api.canDirectorApprove(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for checking executor sign permission
export function useCanExecutorSign(name: string | null) {
  return useQuery({
    queryKey: [...documentKeys.all, 'canExecutorSign', name] as const,
    queryFn: () => api.canExecutorSign(name!),
    enabled: !!name,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for checking reception submit permission
export function useCanReceptionSubmit() {
  return useQuery({
    queryKey: [...documentKeys.all, 'canReceptionSubmit'] as const,
    queryFn: () => api.canReceptionSubmit(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
