import { useState, useEffect } from 'react'
import {
  FileText,
  Users,
  History,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  XCircle,
  Stamp,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Comments } from './Comments'
import { Progress } from './ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { api } from '../lib/api'
import type { EDODocument } from '../api/documents/types'
import { PdfStampEditor } from './PdfStampEditor'

interface DocumentContentProps {
  document: EDODocument | null
  loading: boolean
}

type TabType = 'document' | 'signatures' | 'history'

export function DocumentContent({ document, loading }: DocumentContentProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>('document')
  const [fullDocument, setFullDocument] = useState<EDODocument | null>(null)
  const [stampEditorOpen, setStampEditorOpen] = useState(false)
  const [pdfKey, setPdfKey] = useState(0) // Ключ для принудительного обновления PDF
  const [pdfLoading, setPdfLoading] = useState(true) // Состояние загрузки PDF

  useEffect(() => {
    const loadFullDocument = async () => {
      if (!document) {
        setFullDocument(null)
        setPdfLoading(false)
        return
      }
      try {
        // Сбрасываем состояние загрузки при смене документа
        setPdfLoading(true)
        const fullDoc = await api.getDocument(document.name)
        setFullDocument(fullDoc)
      } catch (err) {
        console.error('Failed to load full document:', err)
        setFullDocument(document)
        setPdfLoading(false)
      }
    }

    loadFullDocument()
  }, [
    document?.name,
    document?.modified,
    document?.status,
    document?.director_approved,
    document?.director_rejected,
    document?.signatures?.length,
  ])

  // Сбрасываем состояние загрузки при изменении main_document или pdfKey
  useEffect(() => {
    if (fullDocument?.main_document) {
      setPdfLoading(true)
    }
  }, [fullDocument?.main_document, pdfKey])

  // Get all executors (main + co-executors)
  const getAllExecutors = () => {
    if (!fullDocument) return []
    const executors: string[] = []
    if (fullDocument.executor) {
      executors.push(fullDocument.executor)
    }
    if (fullDocument.co_executors) {
      fullDocument.co_executors.forEach(co => {
        if (co.user && !executors.includes(co.user)) {
          executors.push(co.user)
        }
      })
    }
    return executors
  }

  // Get signed executors
  const getSignedExecutors = () => {
    if (!fullDocument || !fullDocument.signatures) return []
    return fullDocument.signatures.map(sig => sig.user)
  }

  // Calculate signature progress
  const getSignatureProgress = () => {
    const allExecutors = getAllExecutors()
    const signedExecutors = getSignedExecutors()
    if (allExecutors.length === 0) return { signed: 0, total: 0, percentage: 0 }
    const signed = signedExecutors.length
    const total = allExecutors.length
    const percentage = (signed / total) * 100
    return { signed, total, percentage }
  }

  // Get approval progress steps - показываем все шаги сразу
  const getApprovalSteps = () => {
    if (!fullDocument) return []

    const steps = []

    // 1. Создан менеджером - всегда completed
    steps.push({
      label: 'Создан менеджером',
      status: 'completed',
      date: fullDocument.creation,
      icon: FileText,
    })

    // 2. Обработан в приёмной
    if (fullDocument.reception_user && fullDocument.reception_decision_date) {
      steps.push({
        label: 'Обработан в приёмной',
        status: 'completed',
        date: fullDocument.reception_decision_date,
        icon: Clock,
      })
    } else {
      steps.push({
        label: 'Обработка в приёмной',
        status: 'pending',
        date: undefined,
        icon: Clock,
      })
    }

    // 3. Согласование директором (показываем только если документ уже обработан в приёмной)
    // Если документ еще не обработан в приёмной, этот шаг не показываем
    if (fullDocument.reception_user && fullDocument.reception_decision_date) {
      if (fullDocument.director_approved) {
        steps.push({
          label: 'Согласован директором',
          status: 'completed',
          date: fullDocument.director_decision_date || undefined,
          icon: CheckCircle2,
        })
      } else if (fullDocument.director_rejected) {
        steps.push({
          label: 'Отказан директором',
          status: 'rejected',
          date: fullDocument.director_decision_date || undefined,
          icon: XCircle,
        })
        return steps // Если отказан, дальше шаги не показываем
      } else {
        steps.push({
          label: 'На согласовании у директора',
          status: 'pending',
          date: undefined,
          icon: Shield,
        })
      }
    }

    // 4. Подписание исполнителями (только если есть исполнители И документ согласован директором)
    // Показываем этот шаг только если директор уже согласовал (или отказал, но тогда мы уже вернулись)
    const allExecutors = getAllExecutors()
    if (
      allExecutors.length > 0 &&
      (fullDocument.director_approved || fullDocument.reception_user)
    ) {
      const progress = getSignatureProgress()
      if (fullDocument.status === 'Выполнено') {
        steps.push({
          label: `Подписание исполнителями (${progress.signed}/${progress.total})`,
          status: 'completed',
          date: fullDocument.modified,
          icon: Users,
        })
      } else if (fullDocument.status === 'На исполнении') {
        steps.push({
          label: `Подписание исполнителями (${progress.signed}/${progress.total})`,
          status: 'pending',
          date: undefined,
          icon: Users,
        })
      } else {
        steps.push({
          label: `Подписание исполнителями (0/${allExecutors.length})`,
          status: 'pending',
          date: undefined,
          icon: Users,
        })
      }
    }

    // 5. Выполнено
    if (fullDocument.status === 'Выполнено') {
      steps.push({
        label: 'Выполнено',
        status: 'completed',
        date: fullDocument.modified,
        icon: Sparkles,
      })
    } else {
      steps.push({
        label: 'Выполнено',
        status: 'pending',
        date: undefined,
        icon: Sparkles,
      })
    }

    return steps
  }

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
        <p className="text-muted-foreground">{t('documentContent.selectDocumentMessage')}</p>
      </div>
    )
  }

  const currentDoc = fullDocument || document
  const approvalSteps = getApprovalSteps()
  const signatureProgress = getSignatureProgress()

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="border-b px-6 pt-2">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('document')}
            className={`relative pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'document'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('documentContent.tabs.document')}
          </button>
          <button
            onClick={() => setActiveTab('signatures')}
            className={`relative pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'signatures'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('documentContent.tabs.signatures')} ({signatureProgress.signed}/
            {signatureProgress.total})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`relative pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('documentContent.tabs.history')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar-blue">
        {activeTab === 'document' && (
          <>
            {/* PDF Preview */}
            {currentDoc.main_document ? (
              <div className="bg-white border rounded-lg shadow-sm mb-6">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="text-sm font-medium">Превью документа</h3>
                  {currentDoc.main_document.toLowerCase().endsWith('.pdf') && (
                    <Button variant="outline" size="sm" onClick={() => setStampEditorOpen(true)}>
                      <Stamp className="w-4 h-4 mr-2" />
                      Добавить штамп
                    </Button>
                  )}
                </div>
                <div className="w-full relative bg-gray-50" style={{ height: '800px' }}>
                  {/* Скелетон загрузки с Framer Motion анимацией */}
                  <AnimatePresence>
                    {pdfLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 overflow-hidden"
                      >
                        {/* Имитация PDF документа - несколько страниц */}
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
                          {/* Первая страница */}
                          <div
                            className="w-full max-w-2xl bg-white rounded shadow-lg animate-pulse"
                            style={{ height: '280px' }}
                          >
                            <div className="h-full flex flex-col p-6 gap-4">
                              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-4 bg-gray-200 rounded w-full"></div>
                              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                              <div className="flex-1 flex flex-col gap-3 mt-4">
                                <div className="h-3 bg-gray-200 rounded w-full"></div>
                                <div className="h-3 bg-gray-200 rounded w-full"></div>
                                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                                <div className="h-3 bg-gray-200 rounded w-full"></div>
                                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                              </div>
                            </div>
                          </div>
                          {/* Вторая страница (частично видна) */}
                          <div
                            className="w-full max-w-2xl bg-white rounded shadow-lg animate-pulse opacity-60"
                            style={{ height: '280px', marginTop: '-20px' }}
                          >
                            <div className="h-full flex flex-col p-6 gap-4">
                              <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                              <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                              <div className="flex-1 flex flex-col gap-3 mt-4">
                                <div className="h-3 bg-gray-200 rounded w-full"></div>
                                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <iframe
                    key={`pdf-${pdfKey}-${currentDoc.main_document}`}
                    // Важно: не используем Date.now() в src, иначе iframe будет
                    // перезагружаться при каждом рендере и "моргать"
                    src={`${currentDoc.main_document}?v=${pdfKey}#toolbar=0`}
                    className={`w-full h-full border-0 ${pdfLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                    title="Document Preview"
                    onLoad={() => {
                      // Задержка чтобы скелетон успел показаться, затем плавно скрываем
                      setTimeout(() => {
                        setPdfLoading(false)
                      }, 300)
                    }}
                    onError={() => {
                      // В случае ошибки тоже скрываем скелетон
                      setPdfLoading(false)
                    }}
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
            {currentDoc.attachments && currentDoc.attachments.length > 0 && (
              <div className="bg-white border rounded-lg shadow-sm mb-6">
                <div className="p-4 border-b">
                  <h3 className="text-sm font-medium">Вложения</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                          Название
                        </th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                          Размер
                        </th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentDoc.attachments.map((attachment: any, index: number) => {
                        const fileSize = attachment.file_size
                          ? `${(attachment.file_size / 1024).toFixed(2)} KB`
                          : '-'
                        return (
                          <tr key={index} className="border-t hover:bg-muted/30">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {attachment.file_name || `Вложение ${index + 1}`}
                                </span>
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
              <Comments
                doctype="EDO Document"
                docname={currentDoc.name}
                refreshTrigger={
                  currentDoc.modified ? new Date(currentDoc.modified).getTime() : undefined
                }
              />
            </div>
          </>
        )}

        {activeTab === 'signatures' && (
          <div className="space-y-6">
            {/* Progress Bar - Процесс согласования */}
            {currentDoc.status !== 'Отказан' && currentDoc.status_name !== 'Отказан' && (
              <Card className="border-2 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Процесс согласования
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 pb-4">
                  <div className="space-y-4">
                    {approvalSteps.map((step, index) => {
                      const Icon = step.icon
                      return (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`relative p-1.5 rounded-full transition-all ${
                                step.status === 'completed'
                                  ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500'
                                  : step.status === 'rejected'
                                    ? 'bg-red-100 dark:bg-red-900/30 ring-2 ring-red-500'
                                    : 'bg-gray-100 dark:bg-gray-800 ring-2 ring-gray-300 dark:ring-gray-700'
                              }`}
                            >
                              <Icon
                                className={`w-4 h-4 ${
                                  step.status === 'completed'
                                    ? 'text-green-600 dark:text-green-400'
                                    : step.status === 'rejected'
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-gray-400'
                                }`}
                              />
                            </div>
                            {index < approvalSteps.length - 1 && (
                              <div
                                className={`w-0.5 h-8 mt-1 transition-all ${
                                  step.status === 'completed'
                                    ? 'bg-gradient-to-b from-green-500 to-green-300'
                                    : step.status === 'rejected'
                                      ? 'bg-gradient-to-b from-red-500 to-red-300'
                                      : 'bg-gray-300 dark:bg-gray-700'
                                }`}
                              />
                            )}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p
                              className={`font-medium text-sm transition-colors ${
                                step.status === 'completed'
                                  ? 'text-green-700 dark:text-green-400'
                                  : step.status === 'rejected'
                                    ? 'text-red-700 dark:text-red-400'
                                    : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {step.label}
                            </p>
                            {step.date && (
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(step.date).toLocaleString('ru-RU')}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Signatures Card */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Подписи исполнителей
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {signatureProgress.total > 0 ? (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        Прогресс подписания
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {signatureProgress.signed} из {signatureProgress.total}
                      </span>
                    </div>
                    <Progress value={signatureProgress.percentage} className="h-2" />
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-muted-foreground text-center">
                      Исполнители не назначены для этого документа
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {getAllExecutors().length > 0 ? (
                    getAllExecutors().map(executorId => {
                      const signature = currentDoc.signatures?.find(sig => sig.user === executorId)
                      const executorInfo =
                        currentDoc.executor === executorId
                          ? {
                              name: currentDoc.executor_full_name || executorId,
                              image: currentDoc.executor_image,
                            }
                          : currentDoc.co_executors?.find(co => co.user === executorId)
                            ? {
                                name:
                                  currentDoc.co_executors.find(co => co.user === executorId)
                                    ?.user_full_name || executorId,
                                image: currentDoc.co_executors.find(co => co.user === executorId)
                                  ?.user_image,
                              }
                            : { name: executorId, image: undefined }

                      return (
                        <div
                          key={executorId}
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                            signature
                              ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 shadow-sm'
                              : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                          }`}
                        >
                          {executorInfo.image ? (
                            <img
                              src={executorInfo.image}
                              alt={executorInfo.name}
                              className="w-12 h-12 rounded-full ring-2 ring-offset-2 ring-blue-500"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-base ring-2 ring-offset-2 ring-blue-500">
                              {executorInfo.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                              {executorInfo.name}
                            </p>
                            {signature ? (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                <p className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                                  Подписан:{' '}
                                  {signature.signed_at
                                    ? new Date(signature.signed_at).toLocaleString('ru-RU')
                                    : ''}
                                </p>
                                {signature.comment && (
                                  <p className="mt-1 p-2 bg-white dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300 text-xs">
                                    {signature.comment}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-1">
                                Ожидает подписания
                              </p>
                            )}
                          </div>
                          {signature ? (
                            <div className="p-1.5 bg-green-100 dark:bg-green-900/50 rounded-full">
                              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">Нет назначенных исполнителей</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'history' && (
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-5 h-5 text-gray-600" />
                История изменений
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {approvalSteps.map((step, index) => {
                  const Icon = step.icon
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div
                        className={`p-1.5 rounded-full ${
                          step.status === 'completed'
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : step.status === 'rejected'
                              ? 'bg-red-100 dark:bg-red-900/30'
                              : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            step.status === 'completed'
                              ? 'text-green-600 dark:text-green-400'
                              : step.status === 'rejected'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-400'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium text-sm ${
                            step.status === 'completed'
                              ? 'text-green-700 dark:text-green-400'
                              : step.status === 'rejected'
                                ? 'text-red-700 dark:text-red-400'
                                : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {step.label}
                        </p>
                        {step.date && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(step.date).toLocaleString('ru-RU')}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* PDF Stamp Editor Modal */}
      {stampEditorOpen && currentDoc.main_document && (
        <PdfStampEditor
          documentName={currentDoc.name}
          pdfUrl={currentDoc.main_document}
          onClose={() => setStampEditorOpen(false)}
          onStampApplied={async () => {
            setStampEditorOpen(false)
            // Reload document to show stamped version (main_document is now stamped)
            if (document) {
              try {
                // Небольшая задержка, чтобы дать серверу время сохранить файл
                await new Promise(resolve => setTimeout(resolve, 500))

                const fullDoc = await api.getDocument(document.name)
                setFullDocument(fullDoc)

                // Принудительно обновляем PDF, добавляя ключ к URL
                setPdfKey(prev => prev + 1)
                // Сбрасываем состояние загрузки для нового файла
                setPdfLoading(true)

                console.log('Document reloaded after stamp application:', fullDoc)
                console.log('New main_document:', fullDoc.main_document)
              } catch (error) {
                console.error('Failed to reload document after stamp application:', error)
                alert('Штампы применены, но не удалось обновить документ. Обновите страницу.')
              }
            }
          }}
        />
      )}
    </div>
  )
}
