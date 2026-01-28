import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { StampPlacement } from './types'
import { documentKeys } from '../documents/api'

// Query keys for stamps
export const stampKeys = {
  all: ['stamps'] as const,
  lists: () => [...stampKeys.all, 'list'] as const,
  list: () => [...stampKeys.lists()] as const,
  preview: (stampName: string, documentName?: string) =>
    [...stampKeys.all, 'preview', stampName, documentName] as const,
  pdfInfo: (documentName: string) => [...stampKeys.all, 'pdfInfo', documentName] as const,
}

// Hook for fetching stamps
export function useStamps() {
  return useQuery({
    queryKey: stampKeys.list(),
    queryFn: () => api.getStamps(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for getting stamp preview
export function useStampPreview(stampName: string, documentName?: string) {
  return useQuery({
    queryKey: stampKeys.preview(stampName, documentName),
    queryFn: () => api.getStampPreview(stampName, documentName),
    enabled: !!stampName,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for getting PDF info
export function usePdfInfo(documentName: string | null) {
  return useQuery({
    queryKey: stampKeys.pdfInfo(documentName || ''),
    queryFn: async () => {
      try {
        return await api.getPdfInfo(documentName!)
      } catch (error: any) {
        // Обрабатываем различные типы ошибок
        const errorMessage = String(error?.message || '')
        const errorString = String(error)
        
        // Игнорируем ошибку 417, ошибку "not a PDF file" или любые другие ошибки валидации
        const isIgnorableError =
          errorMessage.includes('417') ||
          errorMessage.includes('EXPECTATION FAILED') ||
          errorMessage.includes('Main document is not a PDF file') ||
          errorMessage.includes('not a PDF') ||
          errorMessage.includes('ValidationError') ||
          errorMessage.includes('frappe.exceptions.ValidationError') ||
          errorString.includes('Main document is not a PDF file') ||
          errorString.includes('frappe.exceptions.ValidationError')
        
        if (isIgnorableError) {
          // Тихая обработка - возвращаем дефолтные значения без ошибки
          // Не логируем в консоль, чтобы не засорять
          return {
            page_count: 1,
            pages: [{ width: 595, height: 842 }], // A4 размер по умолчанию
          }
        }
        // Для других ошибок пробрасываем дальше
        throw error
      }
    },
    enabled: !!documentName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Не retry для ошибок
    refetchOnWindowFocus: false,
    // Не показываем ошибки в UI - они обрабатываются внутри
    throwOnError: false,
  })
}

// Hook for applying stamps
export function useApplyStamps() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { documentName: string; stamps: StampPlacement[] }) => {
      return api.applyStamps(data.documentName, data.stamps)
    },
    onSuccess: (_, variables) => {
      // Invalidate document to refetch with new file
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(variables.documentName) })
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })
}
