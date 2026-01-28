import { Controller, useWatch } from 'react-hook-form'
import type { UseFormReturn, Control } from 'react-hook-form'
import { useMemo, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Button } from '../components/ui/button'
import { X, Tag, FileType, AlertCircle, Building2 } from 'lucide-react'
import type { DocumentFiltersForm } from './types'
import type {
  EDOStatus,
  EDODocumentType,
  EDOPriority,
  EDOCorrespondent,
} from '../api/references/types'

// Isolated clear button - only this component re-renders when filter values change
const ClearFiltersButton = memo(function ClearFiltersButton({
  control,
  onClear,
}: {
  control: Control<DocumentFiltersForm>
  onClear: () => void
}) {
  const { t } = useTranslation()

  const status = useWatch({ control, name: 'status' })
  const documentType = useWatch({ control, name: 'document_type' })
  const priority = useWatch({ control, name: 'priority' })
  const correspondent = useWatch({ control, name: 'correspondent' })

  const activeFiltersCount = useMemo(
    () => [status, documentType, priority, correspondent].filter(Boolean).length,
    [status, documentType, priority, correspondent]
  )

  if (activeFiltersCount === 0) return null

  return (
    <Button variant="outline" size="sm" onClick={onClear} className="w-full h-9 text-sm">
      <X className="w-4 h-4 mr-2" />
      {t('filters.clearFilters', { count: activeFiltersCount })}
    </Button>
  )
})

interface DocumentFiltersProps {
  statuses: EDOStatus[]
  documentTypes: EDODocumentType[]
  priorities: EDOPriority[]
  correspondents: EDOCorrespondent[]
  form: UseFormReturn<DocumentFiltersForm>
  onClear?: () => void
}

function DocumentFiltersComponent({
  statuses,
  documentTypes,
  priorities,
  correspondents,
  form,
  onClear,
}: DocumentFiltersProps) {
  const { t } = useTranslation()
  const { control, reset, getValues } = form

  const handleClear = useCallback(() => {
    const currentSearch = getValues('search')
    reset({
      search: currentSearch || '',
      status: '',
      document_type: '',
      priority: '',
      correspondent: '',
    })
    onClear?.()
  }, [reset, getValues, onClear])

  return (
    <div className="space-y-3">
      {/* Status Filter */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5" />
          {t('filters.status')}
        </label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={t('filters.selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status.name} value={status.name}>
                    {status.status_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Document Type Filter */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <FileType className="w-3.5 h-3.5" />
          {t('filters.documentType')}
        </label>
        <Controller
          name="document_type"
          control={control}
          render={({ field }) => (
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={t('filters.selectDocumentType')} />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map(type => (
                  <SelectItem key={type.name} value={type.name}>
                    {type.document_type_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Priority Filter */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {t('filters.priority')}
        </label>
        <Controller
          name="priority"
          control={control}
          render={({ field }) => (
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={t('filters.selectPriority')} />
              </SelectTrigger>
              <SelectContent>
                {priorities.map(priority => (
                  <SelectItem key={priority.name} value={priority.name}>
                    {priority.priority_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Correspondent Filter */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          {t('filters.correspondent')}
        </label>
        <Controller
          name="correspondent"
          control={control}
          render={({ field }) => (
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={t('filters.selectCorrespondent')} />
              </SelectTrigger>
              <SelectContent>
                {correspondents.map(corr => (
                  <SelectItem key={corr.name} value={corr.name}>
                    {corr.correspondent_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Clear Filters Button - isolated to prevent parent re-renders */}
      <ClearFiltersButton control={control} onClear={handleClear} />
    </div>
  )
}

// Memoize component to prevent re-renders when props haven't changed
export const DocumentFilters = memo(DocumentFiltersComponent, (prevProps, nextProps) => {
  // Re-render only if these props change
  return (
    prevProps.statuses === nextProps.statuses &&
    prevProps.documentTypes === nextProps.documentTypes &&
    prevProps.priorities === nextProps.priorities &&
    prevProps.correspondents === nextProps.correspondents &&
    prevProps.form === nextProps.form
  )
})
