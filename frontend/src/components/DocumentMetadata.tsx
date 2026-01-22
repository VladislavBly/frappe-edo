import { CheckCircle2, Clock, Download, Printer, History, PenLine } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const { t, i18n } = useTranslation()
  
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

            {document.document_type && (
              <div>
                <p className="text-xs text-muted-foreground">{t('documentMetadata.documentType')}</p>
                <p className="font-medium">{document.document_type}</p>
              </div>
            )}

            {document.document_date && (
              <div>
                <p className="text-xs text-muted-foreground">{t('documentMetadata.creationDate')}</p>
                <p className="font-medium">{formatDate(document.document_date)}</p>
              </div>
            )}

            {document.author && (
              <div>
                <p className="text-xs text-muted-foreground">{t('documentMetadata.from')}</p>
                <p className="font-medium">{document.author}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground">{t('documentMetadata.organization')}</p>
              <p className="font-medium">АК "Узбектелеком"</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">{t('documentMetadata.status')}</p>
              <p className={`font-medium ${getStatusColor(document.status)}`}>
                {document.status}
              </p>
            </div>
          </div>
        </div>

        {/* Signing progress */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {t('documentMetadata.signingProgress')}
          </h3>
          <p className="text-sm mb-2">{signedCount} {t('common.of')} {totalSigners}</p>
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
            {t('documentMetadata.signaturesRequired')}
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
                      {t('documentMetadata.signedAt')} {signer.signedAt}
                    </p>
                  )}
                  {!signer.signed && (
                    <p className="text-xs text-orange-500 mt-1">
                      {t('documentMetadata.waitingSignature')}
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
