import { FileText, Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { EDODocument } from '../lib/api'

interface DocumentContentProps {
  document: EDODocument | null
  loading: boolean
}

export function DocumentContent({ document, loading }: DocumentContentProps) {
  const { t, i18n } = useTranslation()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">{t('documentContent.loading')}</div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('documentContent.noDocumentSelected')}</h2>
        <p className="text-muted-foreground">
          {t('documentContent.selectDocumentMessage')}
        </p>
      </div>
    )
  }

  // Format document date for display
  const formatDate = (dateStr: string) => {
    const locale = i18n.language === 'uz' ? 'uz-UZ' : i18n.language === 'en' ? 'en-US' : 'ru-RU'
    return new Date(dateStr).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="border-b px-6 pt-4">
        <div className="flex gap-6">
          <button className="pb-3 px-1 border-b-2 border-primary font-medium text-sm">
            {t('documentContent.tabs.document')}
          </button>
          <button className="pb-3 px-1 text-muted-foreground text-sm hover:text-foreground">
            {t('documentContent.tabs.signatures')} (2/3)
          </button>
          <button className="pb-3 px-1 text-muted-foreground text-sm hover:text-foreground">
            {t('documentContent.tabs.history')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Document header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{document.title}</h1>
            <p className="text-muted-foreground text-sm">
              № {document.name} от {document.document_date && formatDate(document.document_date)}
            </p>
          </div>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Eye className="w-4 h-4" />
            {t('documentContent.viewMode')}
          </button>
        </div>

        {/* Alert banner if pending signatures */}
        {(document.status === t('documents.status.pending') || document.status === 'На подписании') && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white text-xs">!</span>
              </div>
              <div>
                <p className="font-medium text-orange-800">{t('documentContent.signatureRequired')}</p>
                <p className="text-sm text-orange-700">
                  {t('documentContent.signatureWaiting')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Document body */}
        <div className="bg-white border rounded-lg p-8 shadow-sm">
          {document.description ? (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: document.description }}
            />
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('documentContent.noContent')}</p>
            </div>
          )}
        </div>

        {/* Signature blocks */}
        <div className="grid grid-cols-2 gap-8 mt-8">
          <div>
            <p className="font-semibold mb-2">{t('documentContent.supplier')}</p>
            <p className="text-sm text-muted-foreground mb-4">{document.author || t('documentContent.notSpecified')}</p>
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground">{t('documentContent.signature')}</p>
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">{t('documentContent.buyer')}</p>
            <p className="text-sm text-muted-foreground mb-4">Контрагент</p>
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground">{t('documentContent.signature')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
