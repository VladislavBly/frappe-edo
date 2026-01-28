import { FileText, Calendar, Search, Plus, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState, memo, useMemo } from 'react'
import { Controller, useWatch } from 'react-hook-form'
import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import { useCurrentUser } from '../api/users/api'
import {
  useStatuses,
  useDocumentTypes,
  usePriorities,
  useCorrespondents,
} from '../api/references/api'
import { DocumentFilters } from '../forms/documentFilters'
import { useDocumentFilters } from '../forms'
import type { EDODocument } from '../api/documents/types'
import { AddDocumentDialog } from './AddDocumentDialog'

// Isolated component for filter toggle button to prevent re-renders
// Uses useWatch to subscribe only to specific fields
const FilterToggleButton = memo(
  ({
    showFilters,
    onToggle,
    filtersForm,
  }: {
    showFilters: boolean
    onToggle: () => void
    filtersForm: ReturnType<typeof useDocumentFilters>['form']
  }) => {
    const { t } = useTranslation()
    
    // Use useWatch to subscribe only to filter fields - this component will re-render
    // only when these specific fields change, not the entire sidebar
    const status = useWatch({ control: filtersForm.control, name: 'status' })
    const documentType = useWatch({ control: filtersForm.control, name: 'document_type' })
    const priority = useWatch({ control: filtersForm.control, name: 'priority' })
    const correspondent = useWatch({ control: filtersForm.control, name: 'correspondent' })

    const activeFiltersCount = useMemo(
      () => [status, documentType, priority, correspondent].filter(Boolean).length,
      [status, documentType, priority, correspondent]
    )

    return (
      <div className="p-3 border-b bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-between h-9"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">{t('filters.title')}</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          {showFilters ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    )
  }
)
FilterToggleButton.displayName = 'FilterToggleButton'

// Isolated component for empty state message to prevent re-renders
const EmptyStateMessage = memo(
  ({ filtersForm }: { filtersForm: ReturnType<typeof useDocumentFilters>['form'] }) => {
    // Use useWatch to subscribe only to filter fields
    const search = useWatch({ control: filtersForm.control, name: 'search' })
    const status = useWatch({ control: filtersForm.control, name: 'status' })
    const documentType = useWatch({ control: filtersForm.control, name: 'document_type' })
    const priority = useWatch({ control: filtersForm.control, name: 'priority' })
    const correspondent = useWatch({ control: filtersForm.control, name: 'correspondent' })

    const hasFilters = useMemo(
      () => !!(search || status || documentType || priority || correspondent),
      [search, status, documentType, priority, correspondent]
    )

    if (!hasFilters) return null

    return (
      <p className="text-xs text-muted-foreground">
        Попробуйте изменить параметры поиска или фильтры
      </p>
    )
  }
)
EmptyStateMessage.displayName = 'EmptyStateMessage'

// Isolated component for filters panel to prevent re-renders
const FiltersPanel = memo(
  ({
    statuses,
    documentTypes,
    priorities,
    correspondents,
    filtersForm,
  }: {
    statuses: ReturnType<typeof useStatuses>['data']
    documentTypes: ReturnType<typeof useDocumentTypes>['data']
    priorities: ReturnType<typeof usePriorities>['data']
    correspondents: ReturnType<typeof useCorrespondents>['data']
    filtersForm: ReturnType<typeof useDocumentFilters>['form']
  }) => {
    return (
      <div className="p-3 border-b bg-muted/20 space-y-3 animate-in slide-in-from-top-2 duration-200">
        <DocumentFilters
          statuses={statuses || []}
          documentTypes={documentTypes || []}
          priorities={priorities || []}
          correspondents={correspondents || []}
          form={filtersForm}
        />
      </div>
    )
  }
)
FiltersPanel.displayName = 'FiltersPanel'

interface DocumentSidebarProps {
  documents: EDODocument[]
  selectedDocument: EDODocument | null
  onSelectDocument: (doc: EDODocument) => void
  loading: boolean
  error: string | null
  onDocumentsRefresh?: () => void
  filtersForm: ReturnType<typeof useDocumentFilters>['form']
}

function DocumentSidebarComponent({
  documents,
  selectedDocument,
  onSelectDocument,
  loading,
  error,
  onDocumentsRefresh,
  filtersForm,
}: DocumentSidebarProps) {
  const { t } = useTranslation()
  const { data: currentUser } = useCurrentUser()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Use hooks for reference data
  const { data: statuses = [] } = useStatuses()
  const { data: documentTypes = [] } = useDocumentTypes()
  const { data: priorities = [] } = usePriorities()
  const { data: correspondents = [] } = useCorrespondents()

  const canCreateDocument =
    currentUser?.roles?.includes('EDO Admin') || currentUser?.roles?.includes('EDO Manager')

  const handleAddDocument = () => {
    setShowAddDialog(true)
  }

  const handleDocumentCreated = async (doc: EDODocument) => {
    // Reload documents list to show the new document
    if (onDocumentsRefresh) {
      await onDocumentsRefresh()
      // Auto-select the newly created document
      if (doc) {
        // Wait a bit for the list to update, then select the new document
        setTimeout(() => {
          onSelectDocument(doc)
        }, 100)
      }
    }
  }

  const getStatusVariant = (status: string) => {
    if (status === t('documents.status.signed') || status === 'Подписан') {
      return 'default'
    }
    if (status === t('documents.status.pending') || status === 'На подписании') {
      return 'secondary'
    }
    if (status === t('documents.status.archived') || status === 'Архив') {
      return 'outline'
    }
    return 'secondary'
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        {/* Search skeleton */}
        <div className="p-3 border-b">
          <Skeleton className="h-9 w-full" />
        </div>

        {/* Document list skeletons */}
        <div className="flex-1 overflow-y-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-16 shrink-0" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Controller
              name="search"
              control={filtersForm.control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder={t('documentSidebar.searchPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            />
          </div>
        </div>

        {/* Filters Toggle Button */}
        <FilterToggleButton
          showFilters={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
          filtersForm={filtersForm}
        />

        {/* Filters Panel */}
        {showFilters && (
          <FiltersPanel
            statuses={statuses}
            documentTypes={documentTypes}
            priorities={priorities}
            correspondents={correspondents}
            filtersForm={filtersForm}
          />
        )}

        {/* Add document button */}
        {canCreateDocument && (
          <div className="p-3 border-b bg-muted/30">
            <Button onClick={handleAddDocument} className="w-full" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t('documentSidebar.addDocument')}
            </Button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 border-b">
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {t('common.error')}: {error}
            </div>
          </div>
        )}

        {/* Document list or empty state */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {documents.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <FileText className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                {t('documentSidebar.noDocuments')}
              </p>
              <EmptyStateMessage filtersForm={filtersForm} />
            </div>
          ) : (
            documents.map(doc => (
              <div
                key={doc.name}
                onClick={() => onSelectDocument(doc)}
                className={cn(
                  'p-4 border-b cursor-pointer transition-colors hover:bg-muted/50',
                  selectedDocument?.name === doc.name && 'bg-muted'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-sm line-clamp-2">{doc.title}</h3>
                  <Badge variant={getStatusVariant(doc.status)} className="text-xs shrink-0">
                    {doc.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {doc.document_type && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {doc.document_type}
                    </span>
                  )}
                  {doc.document_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(doc.document_date).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Document Dialog */}
      <AddDocumentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onDocumentCreated={handleDocumentCreated}
      />
    </>
  )
}

// Memoize component to prevent re-renders when props haven't changed
export const DocumentSidebar = memo(DocumentSidebarComponent, (prevProps, nextProps) => {
  // Re-render only if these props change
  // Compare documents by reference and length to avoid unnecessary re-renders
  const documentsEqual =
    prevProps.documents === nextProps.documents ||
    (prevProps.documents.length === nextProps.documents.length &&
      prevProps.documents.every((doc, i) => doc.name === nextProps.documents[i]?.name))

  return (
    documentsEqual &&
    prevProps.selectedDocument?.name === nextProps.selectedDocument?.name &&
    prevProps.loading === nextProps.loading &&
    prevProps.error === nextProps.error &&
    prevProps.filtersForm === nextProps.filtersForm
  )
})
