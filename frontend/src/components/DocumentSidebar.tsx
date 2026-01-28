import { FileText, Calendar, Search, Plus, X, Filter, ChevronDown, ChevronUp, Tag, FileType, AlertCircle, Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'
import { Button } from './ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { cn } from '../lib/utils'
import { api, type EDODocument, type EDOStatus, type EDODocumentType, type EDOPriority, type EDOCorrespondent } from '../lib/api'
import { AddDocumentDialog } from './AddDocumentDialog'

interface DocumentSidebarProps {
  documents: EDODocument[]
  selectedDocument: EDODocument | null
  onSelectDocument: (doc: EDODocument) => void
  loading: boolean
  error: string | null
  onDocumentsRefresh?: () => void
  onFiltersChange?: (filters: {
    search?: string
    status?: string
    document_type?: string
    priority?: string
    correspondent?: string
  }) => void
}

export function DocumentSidebar({
  documents,
  selectedDocument,
  onSelectDocument,
  loading,
  error,
  onDocumentsRefresh,
  onFiltersChange,
}: DocumentSidebarProps) {
  const { t } = useTranslation()
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [correspondentFilter, setCorrespondentFilter] = useState<string>('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Reference data for filters
  const [statuses, setStatuses] = useState<EDOStatus[]>([])
  const [documentTypes, setDocumentTypes] = useState<EDODocumentType[]>([])
  const [priorities, setPriorities] = useState<EDOPriority[]>([])
  const [correspondents, setCorrespondents] = useState<EDOCorrespondent[]>([])

  useEffect(() => {
    loadUserRoles()
    loadFilterData()
  }, [])

  const loadFilterData = async () => {
    try {
      const [statusesData, typesData, prioritiesData, correspondentsData] = await Promise.all([
        api.getStatuses().catch(() => []),
        api.getDocumentTypes().catch(() => []),
        api.getPriorities().catch(() => []),
        api.getCorrespondents().catch(() => []),
      ])
      setStatuses(statusesData || [])
      setDocumentTypes(typesData || [])
      setPriorities(prioritiesData || [])
      setCorrespondents(correspondentsData || [])
    } catch (err) {
      console.error('Failed to load filter data:', err)
      // Устанавливаем пустые массивы в случае ошибки
      setStatuses([])
      setDocumentTypes([])
      setPriorities([])
      setCorrespondents([])
    }
  }

  const applyFilters = useCallback(() => {
    if (onFiltersChange) {
      onFiltersChange({
        search: searchQuery.trim() || undefined,
        status: statusFilter || undefined,
        document_type: documentTypeFilter || undefined,
        priority: priorityFilter || undefined,
        correspondent: correspondentFilter || undefined,
      })
    }
  }, [searchQuery, statusFilter, documentTypeFilter, priorityFilter, correspondentFilter, onFiltersChange])

  // Debounced search - only apply filters after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters()
    }, 500) // Increased debounce time
    return () => clearTimeout(timer)
  }, [searchQuery, statusFilter, documentTypeFilter, priorityFilter, correspondentFilter, applyFilters])

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
    setDocumentTypeFilter('')
    setPriorityFilter('')
    setCorrespondentFilter('')
  }

  const activeFiltersCount = [
    statusFilter,
    documentTypeFilter,
    priorityFilter,
    correspondentFilter
  ].filter(Boolean).length

  const loadUserRoles = async () => {
    try {
      const user = await api.getCurrentUser()
      setUserRoles(user.roles || [])
    } catch (err) {
      console.error('Failed to load user roles:', err)
    }
  }

  const canCreateDocument = userRoles.includes('EDO Admin') || userRoles.includes('EDO Manager')

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
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('documentSidebar.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value
                const wasFocused = document.activeElement === e.target
                setSearchQuery(value)
                // Restore focus after state update
                if (wasFocused && searchInputRef.current) {
                  requestAnimationFrame(() => {
                    if (searchInputRef.current) {
                      searchInputRef.current.focus()
                      // Move cursor to end
                      const length = searchInputRef.current.value.length
                      searchInputRef.current.setSelectionRange(length, length)
                    }
                  })
                }
              }}
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Filters Toggle Button */}
        <div className="p-3 border-b bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full justify-between h-9"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Фильтры</span>
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

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-3 border-b bg-muted/20 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* Status Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Статус
              </label>
              <Select value={statusFilter || undefined} onValueChange={(value) => setStatusFilter(value || '')}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.name} value={status.name}>
                      {status.status_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Document Type Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <FileType className="w-3.5 h-3.5" />
                Тип документа
              </label>
              <Select value={documentTypeFilter || undefined} onValueChange={(value) => setDocumentTypeFilter(value || '')}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.name} value={type.name}>
                      {type.document_type_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Приоритет
              </label>
              <Select value={priorityFilter || undefined} onValueChange={(value) => setPriorityFilter(value || '')}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Выберите приоритет" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.name} value={priority.name}>
                      {priority.priority_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Correspondent Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Корреспондент
              </label>
              <Select value={correspondentFilter || undefined} onValueChange={(value) => setCorrespondentFilter(value || '')}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Выберите корреспондента" />
                </SelectTrigger>
                <SelectContent>
                  {correspondents.map((corr) => (
                    <SelectItem key={corr.name} value={corr.name}>
                      {corr.correspondent_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full h-9 text-sm"
              >
                <X className="w-4 h-4 mr-2" />
                Очистить фильтры ({activeFiltersCount})
              </Button>
            )}
          </div>
        )}

        {/* Add document button */}
        {canCreateDocument && (
          <div className="p-3 border-b bg-muted/30">
            <Button
              onClick={handleAddDocument}
              className="w-full"
              size="sm"
            >
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
              <p className="text-sm text-muted-foreground mb-1">{t('documentSidebar.noDocuments')}</p>
              {(searchQuery || activeFiltersCount > 0) && (
                <p className="text-xs text-muted-foreground">
                  Попробуйте изменить параметры поиска или фильтры
                </p>
              )}
            </div>
          ) : (
            documents.map((doc) => (
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
