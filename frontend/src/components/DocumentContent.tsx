import { FileText, Eye } from 'lucide-react'
import type { EDODocument } from '../lib/api'

interface DocumentContentProps {
  document: EDODocument | null
  loading: boolean
}

export function DocumentContent({ document, loading }: DocumentContentProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Загрузка документа...</div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Выберите документ</h2>
        <p className="text-muted-foreground">
          Выберите документ из списка слева для просмотра
        </p>
      </div>
    )
  }

  // Format document date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
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
            Документ
          </button>
          <button className="pb-3 px-1 text-muted-foreground text-sm hover:text-foreground">
            Подписи (2/3)
          </button>
          <button className="pb-3 px-1 text-muted-foreground text-sm hover:text-foreground">
            История
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
            Режим просмотра
          </button>
        </div>

        {/* Alert banner if pending signatures */}
        {document.status === 'На подписании' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white text-xs">!</span>
              </div>
              <div>
                <p className="font-medium text-orange-800">Требуется подпись</p>
                <p className="text-sm text-orange-700">
                  Документ ожидает подписи от уполномоченных лиц
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
              <p>Содержимое документа не указано</p>
            </div>
          )}
        </div>

        {/* Signature blocks */}
        <div className="grid grid-cols-2 gap-8 mt-8">
          <div>
            <p className="font-semibold mb-2">ПОСТАВЩИК:</p>
            <p className="text-sm text-muted-foreground mb-4">{document.author || 'Не указан'}</p>
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground">Подпись / ЭЦП</p>
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">ПОКУПАТЕЛЬ:</p>
            <p className="text-sm text-muted-foreground mb-4">Контрагент</p>
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground">Подпись / ЭЦП</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
