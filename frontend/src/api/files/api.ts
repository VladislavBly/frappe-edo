import { useMutation } from '@tanstack/react-query'
import { api } from '../../lib/api'

// Query keys for files
export const fileKeys = {
  all: ['files'] as const,
}

// Hook for uploading a file
export function useUploadFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      return api.uploadFile(file)
    },
  })
}
