import { Download, Printer, History, PenLine } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import type { EDODocument } from '../lib/api'

interface DocumentMetadataProps {
  document: EDODocument | null
}

export function DocumentMetadata({ document }: DocumentMetadataProps) {
  const { t, i18n } = useTranslation()
  
  if (!document) {
    return null
  }


  const getStatusColor = (status: string) => {
    if (status === t('documents.status.signed') || status === 'Подписан') {
      return 'text-green-600'
    }
    if (status === t('documents.status.pending') || status === 'На подписании') {
      return 'text-orange-500'
    }
    if (status === t('documents.status.archived') || status === 'Архив') {
      return 'text-gray-500'
    }
    return 'text-gray-500'
  }

  const formatDate = (dateStr: string) => {
    const locale = i18n.language === 'uz' ? 'uz-UZ' : i18n.language === 'en' ? 'en-US' : 'ru-RU'
    return new Date(dateStr).toLocaleDateString(locale)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Document info header */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {t('documentMetadata.documentInfo')}
          </h3>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">{t('documentMetadata.documentNumber')}</p>
              <p className="font-medium">{document.name}</p>
            </div>

            {document.title && (
              <div>
                <p className="text-xs text-muted-foreground">Название</p>
                <p className="font-medium">{document.title}</p>
              </div>
            )}

            {document.incoming_number && (
              <div>
                <p className="text-xs text-muted-foreground">Входящий номер</p>
                <p className="font-medium">{document.incoming_number}</p>
              </div>
            )}

            {document.incoming_date && (
              <div>
                <p className="text-xs text-muted-foreground">Входящая дата</p>
                <p className="font-medium">{formatDate(document.incoming_date)}</p>
              </div>
            )}

            {document.outgoing_number && (
              <div>
                <p className="text-xs text-muted-foreground">Исходящий номер</p>
                <p className="font-medium">{document.outgoing_number}</p>
              </div>
            )}

            {document.outgoing_date && (
              <div>
                <p className="text-xs text-muted-foreground">Исходящая дата</p>
                <p className="font-medium">{formatDate(document.outgoing_date)}</p>
              </div>
            )}

            {document.document_type && (
              <div>
                <p className="text-xs text-muted-foreground">{t('documentMetadata.documentType')}</p>
                <p className="font-medium">{document.document_type_name || document.document_type}</p>
              </div>
            )}

            {document.correspondent && (
              <div>
                <p className="text-xs text-muted-foreground">Корреспондент</p>
                <p className="font-medium">{document.correspondent_name || document.correspondent}</p>
              </div>
            )}

            {document.priority && (
              <div>
                <p className="text-xs text-muted-foreground">Приоритет</p>
                <p className="font-medium">{document.priority_name || document.priority}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground">{t('documentMetadata.status')}</p>
              <p className={`font-medium ${getStatusColor(document.status)}`}>
                {document.status_name || document.status}
              </p>
            </div>

            {document.classification && (
              <div>
                <p className="text-xs text-muted-foreground">Гриф</p>
                <p className="font-medium">{document.classification_name || document.classification}</p>
              </div>
            )}

            {document.delivery_method && (
              <div>
                <p className="text-xs text-muted-foreground">Способ доставки</p>
                <p className="font-medium">{document.delivery_method_name || document.delivery_method}</p>
              </div>
            )}

            {document.creation && (
              <div>
                <p className="text-xs text-muted-foreground">Дата создания</p>
                <p className="font-medium">{formatDate(document.creation)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Brief content */}
        {document.brief_content && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Краткое содержание
            </h3>
            <p className="text-sm whitespace-pre-wrap">{document.brief_content}</p>
          </div>
        )}

        {/* Actions */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {t('documentMetadata.actions')}
          </h3>
          <div className="space-y-2">
            {(document.status === t('documents.status.pending') || document.status === 'На подписании') && (
              <Button className="w-full" size="sm">
                <PenLine className="w-4 h-4" />
                {t('documentMetadata.sign')}
              </Button>
            )}
            <Button variant="outline" className="w-full" size="sm">
              <Download className="w-4 h-4" />
              {t('documentMetadata.download')}
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              <Printer className="w-4 h-4" />
              {t('documentMetadata.print')}
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              <History className="w-4 h-4" />
              {t('documentMetadata.history')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
