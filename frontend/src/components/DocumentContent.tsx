import { FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Comments } from './Comments'
import type { EDODocument } from '../lib/api'

interface DocumentContentProps {
  document: EDODocument | null
  loading: boolean
}

export function DocumentContent({ document, loading }: DocumentContentProps) {
  const { t } = useTranslation()
  
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
        {/* PDF Preview */}
        {document.main_document ? (
          <div className="bg-white border rounded-lg shadow-sm mb-6">
            <div className="p-4 border-b">
              <h3 className="text-sm font-medium">Превью документа</h3>
            </div>
            <div className="w-full" style={{ height: '800px' }}>
              <iframe
                src={`${document.main_document}#toolbar=0`}
                className="w-full h-full border-0"
                title="Document Preview"
              />
            </div>
          </div>
        ) : (
          <div className="bg-white border rounded-lg shadow-sm mb-6 p-12 text-center text-muted-foreground">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Документ не загружен</p>
          </div>
        )}

        {/* Attachments Table */}
        {document.attachments && document.attachments.length > 0 && (
          <div className="bg-white border rounded-lg shadow-sm mb-6">
            <div className="p-4 border-b">
              <h3 className="text-sm font-medium">Вложения</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Название</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Размер</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {document.attachments.map((attachment: any, index: number) => {
                    const fileSize = attachment.file_size 
                      ? `${(attachment.file_size / 1024).toFixed(2)} KB`
                      : '-'
                    return (
                      <tr key={index} className="border-t hover:bg-muted/30">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{attachment.file_name || `Вложение ${index + 1}`}</span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{fileSize}</td>
                        <td className="p-3 text-right">
                          <a
                            href={attachment.attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            Открыть
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* Comments */}
        <div className="mt-8 border-t pt-6">
          <Comments doctype="EDO Document" docname={document.name} />
        </div>
      </div>
    </div>
  )
}
