import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

// Query keys for references
export const referenceKeys = {
  all: ['references'] as const,
  documentTypes: () => [...referenceKeys.all, 'documentTypes'] as const,
  correspondents: () => [...referenceKeys.all, 'correspondents'] as const,
  priorities: () => [...referenceKeys.all, 'priorities'] as const,
  statuses: () => [...referenceKeys.all, 'statuses'] as const,
  classifications: () => [...referenceKeys.all, 'classifications'] as const,
  deliveryMethods: () => [...referenceKeys.all, 'deliveryMethods'] as const,
  resolutions: () => [...referenceKeys.all, 'resolutions'] as const,
  receptionOffices: () => [...referenceKeys.all, 'receptionOffices'] as const,
}

// Hook for fetching document types
export function useDocumentTypes() {
  return useQuery({
    queryKey: referenceKeys.documentTypes(),
    queryFn: () => api.getDocumentTypes(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for fetching correspondents
export function useCorrespondents() {
  return useQuery({
    queryKey: referenceKeys.correspondents(),
    queryFn: () => api.getCorrespondents(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for fetching priorities
export function usePriorities() {
  return useQuery({
    queryKey: referenceKeys.priorities(),
    queryFn: () => api.getPriorities(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for fetching statuses
export function useStatuses() {
  return useQuery({
    queryKey: referenceKeys.statuses(),
    queryFn: () => api.getStatuses(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for fetching classifications
export function useClassifications() {
  return useQuery({
    queryKey: referenceKeys.classifications(),
    queryFn: () => api.getClassifications(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for fetching delivery methods
export function useDeliveryMethods() {
  return useQuery({
    queryKey: referenceKeys.deliveryMethods(),
    queryFn: () => api.getDeliveryMethods(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for fetching resolutions
export function useResolutions() {
  return useQuery({
    queryKey: referenceKeys.resolutions(),
    queryFn: () => api.getResolutions(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for fetching reception offices
export function useReceptionOffices() {
  return useQuery({
    queryKey: referenceKeys.receptionOffices(),
    queryFn: () => api.getReceptionOffices(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
