import { CheckCircle2, Clock, Download, Printer, History, PenLine } from 'lucide-react'
import { Button } from './ui/button'
import type { EDODocument } from '../lib/api'

interface Signer {
  name: string
  role: string
  signed: boolean
  signedAt?: string
}

interface DocumentMetadataProps {
  document: EDODocument | null
}

export function DocumentMetadata({ document }: DocumentMetadataProps) {
  if (!document) {
    return null
  }

  // Mock signers data - in real app this would come from API
  const signers: Signer[] = [
    {
      name: 'Иванов Иван Иванович',
      role: 'Генеральный директор',
      signed: true,
      signedAt: '19.01.2026 14:30',
    },
    {
      name: 'Петров Петр Петрович',
      role: 'Главный бухгалтер',
      signed: true,
      signedAt: '19.01.2026 15:45',
    },
    {
      name: 'Сидоров Сидор Сидорович',
      role: 'Юрисконсульт',
      signed: false,
    },
  ]

  const signedCount = signers.filter((s) => s.signed).length
  const totalSigners = signers.length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Подписан':
        return 'text-green-600'
      case 'На подписании':
        return 'text-orange-500'
      case 'Архив':
        return 'text-gray-500'
      default:
        return 'text-gray-500'
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU')
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Document info header */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Информация о документе
          </h3>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Номер документа</p>
              <p className="font-medium">{document.name}</p>
            </div>

            {document.document_type && (
              <div>
                <p className="text-xs text-muted-foreground">Тип документа</p>
                <p className="font-medium">{document.document_type}</p>
              </div>
            )}

            {document.document_date && (
              <div>
                <p className="text-xs text-muted-foreground">Дата создания</p>
                <p className="font-medium">{formatDate(document.document_date)}</p>
              </div>
            )}

            {document.author && (
              <div>
                <p className="text-xs text-muted-foreground">От кого</p>
                <p className="font-medium">{document.author}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground">Организация</p>
              <p className="font-medium">АК "Узбектелеком"</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Статус</p>
              <p className={`font-medium ${getStatusColor(document.status)}`}>
                {document.status}
              </p>
            </div>
          </div>
        </div>

        {/* Signing progress */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Прогресс подписания
          </h3>
          <p className="text-sm mb-2">{signedCount} из {totalSigners}</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${(signedCount / totalSigners) * 100}%` }}
            />
          </div>
        </div>

        {/* Signers list */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Требуется подписи
          </h3>
          <div className="space-y-3">
            {signers.map((signer, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    signer.signed ? 'bg-green-500' : 'bg-orange-400'
                  }`}
                >
                  {signer.signed ? (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  ) : (
                    <Clock className="w-3 h-3 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{signer.name}</p>
                  <p className="text-xs text-muted-foreground">{signer.role}</p>
                  {signer.signed && signer.signedAt && (
                    <p className="text-xs text-green-600 mt-1">
                      Подписано {signer.signedAt}
                    </p>
                  )}
                  {!signer.signed && (
                    <p className="text-xs text-orange-500 mt-1">
                      Ожидает подписи
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Действия
          </h3>
          <div className="space-y-2">
            {document.status === 'На подписании' && (
              <Button className="w-full" size="sm">
                <PenLine className="w-4 h-4" />
                Подписать
              </Button>
            )}
            <Button variant="outline" className="w-full" size="sm">
              <Download className="w-4 h-4" />
              Скачать документ
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              <Printer className="w-4 h-4" />
              Печать
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              <History className="w-4 h-4" />
              История изменений
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
