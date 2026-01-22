import { FileText, Calendar, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'
import type { EDODocument } from '../lib/api'

interface DocumentSidebarProps {
  documents: EDODocument[]
  selectedDocument: EDODocument | null
  onSelectDocument: (doc: EDODocument) => void
  loading: boolean
  error: string | null
}

export function DocumentSidebar({
  documents,
  selectedDocument,
  onSelectDocument,
  loading,
  error,
}: DocumentSidebarProps) {
  const { t } = useTranslation()
  
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
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-destructive">{t('common.error')}: {error}</div>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <FileText className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">{t('documentSidebar.noDocuments')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('documentSidebar.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto">
        {documents.map((doc) => (
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
        ))}
      </div>
    </div>
  )
}
