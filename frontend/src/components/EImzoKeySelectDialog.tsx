import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import { AlertCircle, CheckCircle2, ChevronDown, RefreshCw } from 'lucide-react'
import { EIMZOAPI, getAllCertificatesPfxParsed, type Cert } from '../vendors/e-imzo-func'
import { api } from '../lib/api'
import { useToast } from './ui/toast'

interface EImzoKeySelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onKeySelected: (key: Cert) => void
  documentName?: string
  onDocumentSigned?: () => void
}

export function EImzoKeySelectDialog({
  open,
  onOpenChange,
  onKeySelected: _onKeySelected,
  documentName,
  onDocumentSigned,
}: EImzoKeySelectDialogProps) {
  const [keys, setKeys] = useState<Cert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    if (open) {
      loadKeys()
    } else {
      setKeys([])
      setSelectedKeyIndex(null)
      setError(null)
      setDropdownOpen(false)
    }
  }, [open])

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadKeys = async () => {
    setLoading(true)
    setError(null)
    try {
      const allKeys = await getAllCertificatesPfxParsed()

      if (allKeys.length === 0) {
        setError(t('eImzo.keysNotFound'))
        setLoading(false)
        return
      }

      setKeys(allKeys)
      if (allKeys.length > 0) {
        setSelectedKeyIndex(0)
      }
    } catch (err) {
      console.error('Ошибка загрузки ключей:', err)
      setError(
        err instanceof Error
          ? err.message
          : t('eImzo.loadKeysError')
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = async () => {
    if (selectedKeyIndex === null || !keys[selectedKeyIndex]) return

    if (!documentName) {
      console.error('[E-IMZO] documentName is required')
      setError(t('eImzo.documentNotSpecified'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const cert = keys[selectedKeyIndex]

      // Получаем PDF документ для подписи
      const document = await api.getDocument(documentName)
      if (!document.main_document) {
        throw new Error(t('eImzo.noPdfFile'))
      }

      // Получаем PDF файл
      const pdfResponse = await fetch(document.main_document)
      if (!pdfResponse.ok) {
        throw new Error(t('eImzo.loadPdfError'))
      }
      const pdfBlob = await pdfResponse.blob()
      const pdfArrayBuffer = await pdfBlob.arrayBuffer()
      
      // Конвертируем PDF в Base64
      const pdfBase64 = btoa(
        new Uint8Array(pdfArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      // 1) Загружаем ключ (E-IMZO запросит пароль/пин у пользователя)
      const keyId = await EIMZOAPI.loadKey(cert)

      // 2) Создаем PKCS7 подпись для PDF (attached: 'no' означает detached подпись)
      const pkcs7 = await EIMZOAPI.createPkcs7(keyId, pdfBase64, 'no')

      console.log('[E-IMZO] PKCS7:', pkcs7)

      // 3) Отправляем pkcs7 и document_name на бэкенд
      const result = await api.signDocumentWithPkcs7(documentName, pkcs7)
      
      console.log('[E-IMZO] Результат подписания:', result)

      showToast({
        title: t('eImzo.signSuccess'),
        message: t('eImzo.signSuccessMessage'),
        type: 'success',
      })

      // Закрываем модалку
      onOpenChange(false)
      
      // Вызываем callback если есть
      if (onDocumentSigned) {
        onDocumentSigned()
      }
    } catch (err) {
      console.error('[E-IMZO] Ошибка подписания:', err)

      let errorMessage = t('eImzo.signError')
      let errorSource: 'our_side' | 'lexdoc' = 'our_side'

      if (err instanceof Error) {
        errorMessage = err.message

        const structuredError = (err as any).structuredError
        if (structuredError) {
          errorSource = structuredError.source || 'our_side'
          errorMessage = structuredError.message || errorMessage
        }
      }

      const sourceLabel = errorSource === 'lexdoc' ? t('eImzo.errorSideLexdoc') : t('eImzo.errorSideOur')
      showToast({
        title: `${t('eImzo.errorSidePrefix')} ${sourceLabel}`,
        message: errorMessage,
        type: 'error',
        duration: 8000,
      })

      // ВАЖНО: не кладём ошибку в state, чтобы не ломать UI модалки
      // setError(...)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const parts = dateStr.split(' ')[0].split('.')
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`
    }
    return dateStr
  }

  const getKeyData = (key: Cert) => {
    const alias = key.parsedAlias || {}
    return {
      fio: alias.cn?.toUpperCase() || t('eImzo.unknownKey'),
      serialNumber: alias.serialnumber || '',
      pinfl: alias['1.2.860.3.16.1.2'] || '',
      validFrom: formatDate(alias.validfrom),
      validTo: formatDate(alias.validto),
    }
  }

  const selectedKey = selectedKeyIndex !== null ? keys[selectedKeyIndex] : null
  const selectedData = selectedKey ? getKeyData(selectedKey) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            {t('eImzo.dialogTitle')}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {t('eImzo.selectKeyTitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading && <Skeleton className="h-24 w-full rounded-lg" />}

          {/* Ошибки показываем только через toast, без вывода traceback в контент модалки */}
          {error && (
            <div className="flex items-center justify-between gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive/90">{t('eImzo.loadKeysErrorShort')}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={loadKeys}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          )}

          {!loading && !error && keys.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              {/* Кастомный select trigger */}
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full text-left p-4 border-2 rounded-lg bg-background hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {selectedData ? (
                  <div className="space-y-1 pr-8">
                    <p className="text-sm">
                      <span className="font-medium text-muted-foreground">{t('eImzo.serialNumber')}</span>{' '}
                      {selectedData.serialNumber}
                    </p>
                    <p className="text-sm flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-muted-foreground">{t('eImzo.pinfl')}</span>{' '}
                      {selectedData.pinfl}
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                        {t('eImzo.physicalPerson')}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-muted-foreground">{t('eImzo.fio')}</span>{' '}
                      {selectedData.fio}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-muted-foreground">{t('eImzo.validPeriod')}</span>{' '}
                      {selectedData.validFrom} - {selectedData.validTo}
                    </p>
                  </div>
                ) : (
                  <span className="text-muted-foreground">{t('eImzo.selectCertificate')}</span>
                )}
                <ChevronDown
                  className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-transform ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown список */}
              {dropdownOpen && keys.length > 1 && (
                <div className="absolute z-50 w-full mt-1 border rounded-lg bg-background shadow-lg max-h-[300px] overflow-y-auto">
                  {keys.map((key, index) => {
                    const data = getKeyData(key)
                    const isSelected = selectedKeyIndex === index
                    return (
                      <button
                        key={key.serialNumber || index}
                        type="button"
                        onClick={() => {
                          setSelectedKeyIndex(index)
                          setDropdownOpen(false)
                        }}
                        className={`w-full text-left p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors ${
                          isSelected ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-medium text-muted-foreground">{t('eImzo.serialNumber')}</span>{' '}
                            {data.serialNumber}
                          </p>
                          <p className="text-sm flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-muted-foreground">{t('eImzo.pinfl')}</span>{' '}
                            {data.pinfl}
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                              {t('eImzo.physicalPerson')}
                            </span>
                          </p>
                          <p className="text-sm">
                            <span className="font-medium text-muted-foreground">{t('eImzo.fio')}</span>{' '}
                            {data.fio}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium text-muted-foreground">{t('eImzo.validPeriod')}</span>{' '}
                            {data.validFrom} - {data.validTo}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {!loading && !error && keys.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('eImzo.keysNotFound')}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSelect}
            disabled={loading || selectedKeyIndex === null || keys.length === 0}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {t('eImzo.selectKey')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
