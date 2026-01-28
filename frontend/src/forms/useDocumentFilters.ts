import { useForm } from 'react-hook-form'
import { useDebouncedCallback } from 'use-debounce'
import { useEffect, useRef, useMemo } from 'react'
import type { DocumentFiltersForm } from './types'

interface UseDocumentFiltersOptions {
  defaultValues?: DocumentFiltersForm
  onFiltersChange: (filters: DocumentFiltersForm) => void
  debounceMs?: number
}

export function useDocumentFilters({
  defaultValues,
  onFiltersChange,
  debounceMs = 500,
}: UseDocumentFiltersOptions) {
  // Memoize default values to prevent form recreation
  const memoizedDefaultValues = useMemo(() => defaultValues || {}, [defaultValues])

  const form = useForm<DocumentFiltersForm>({
    defaultValues: memoizedDefaultValues,
    mode: 'onChange', // Use onChange mode for better performance
  })

  // Use ref to keep stable callback reference
  const onFiltersChangeRef = useRef(onFiltersChange)
  useEffect(() => {
    onFiltersChangeRef.current = onFiltersChange
  }, [onFiltersChange])

  const debouncedOnChange = useDebouncedCallback((filters: DocumentFiltersForm) => {
    onFiltersChangeRef.current(filters)
  }, debounceMs)

  // Watch all fields and debounce changes - use watch with callback to avoid re-renders
  useEffect(() => {
    const subscription = form.watch((value) => {
      const filters: DocumentFiltersForm = {
        search: value.search?.trim() || undefined,
        status: value.status || undefined,
        document_type: value.document_type || undefined,
        priority: value.priority || undefined,
        correspondent: value.correspondent || undefined,
      }
      debouncedOnChange(filters)
    })
    return () => subscription.unsubscribe()
  }, [form, debouncedOnChange])

  // Memoize form object to prevent recreation
  const memoizedForm = useMemo(() => form, [form])

  const clearFilters = () => {
    form.reset({
      search: '',
      status: '',
      document_type: '',
      priority: '',
      correspondent: '',
    })
  }

  const getActiveFiltersCount = () => {
    const values = form.getValues()
    return [values.status, values.document_type, values.priority, values.correspondent].filter(
      Boolean
    ).length
  }

  return {
    form: memoizedForm,
    clearFilters,
    getActiveFiltersCount,
    watch: form.watch,
  }
}
