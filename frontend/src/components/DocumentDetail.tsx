import { useEffect, useState } from 'react'
import { ArrowLeft, Calendar, FileText, Clock, CheckCircle2, XCircle, PenTool, History, Sparkles, Shield, Users, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { api, type EDODocument } from '../lib/api'
import { Progress } from './ui/progress'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'

interface DocumentDetailProps {
  documentName: string
}

type TabType = 'document' | 'signatures' | 'history'

export function DocumentDetail({ documentName }: DocumentDetailProps) {
  const [document, setDocument] = useState<EDODocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('document')
  const [canDirectorApprove, setCanDirectorApprove] = useState(false)
  const [canExecutorSign, setCanExecutorSign] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [signDialogOpen, setSignDialogOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadDocument()
  }, [documentName])

  const loadDocument = async () => {
    try {
      setLoading(true)
      const doc = await api.getDocument(documentName)
      setDocument(doc)
      // Check permissions after document is loaded
      await checkPermissions(doc)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document')
    } finally {
      setLoading(false)
    }
  }

  const checkPermissions = async (doc?: EDODocument | null) => {
    try {
      const [canApprove, canSign] = await Promise.all([
        api.canDirectorApprove(),
        api.canExecutorSign(documentName),
      ])
      setCanDirectorApprove(canApprove)
      setCanExecutorSign(canSign)
      // Debug: log permissions with document info
      const currentDoc = doc || document
      console.log('=== PERMISSIONS DEBUG ===')
      console.log('canApprove:', canApprove)
      console.log('canSign:', canSign)
      console.log('document.status:', currentDoc?.status)
      console.log('document.status_name:', currentDoc?.status_name)
      console.log('Status matches "Новый":', currentDoc?.status === 'Новый' || currentDoc?.status_name === 'Новый')
      console.log('Should show buttons:', canApprove && currentDoc && (currentDoc.status === 'Новый' || currentDoc.status_name === 'Новый'))
      console.log('=======================')
    } catch (err) {
      console.error('Failed to check permissions:', err)
    }
  }

  const handleApprove = async () => {
    if (!document) return
    try {
      setActionLoading(true)
      const updated = await api.directorApproveDocument(document.name, comment)
      setDocument(updated)
      setApproveDialogOpen(false)
      setComment('')
      await checkPermissions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка при согласовании')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!document) return
    try {
      setActionLoading(true)
      const updated = await api.directorRejectDocument(document.name, comment)
      setDocument(updated)
      setRejectDialogOpen(false)
      setComment('')
      await checkPermissions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка при отказе')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSign = async () => {
    if (!document) return
    try {
      setActionLoading(true)
      const updated = await api.executorSignDocument(document.name, comment)
      setDocument(updated)
      setSignDialogOpen(false)
      setComment('')
      await checkPermissions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка при подписании')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Выполнено':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
      case 'Согласован':
        return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
      case 'На исполнении':
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
      case 'Отказан':
        return 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
      case 'Новый':
        return 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get all executors (main + co-executors)
  const getAllExecutors = () => {
    if (!document) return []
    const executors: string[] = []
    if (document.executor) {
      executors.push(document.executor)
    }
    if (document.co_executors) {
      document.co_executors.forEach(co => {
        if (co.user && !executors.includes(co.user)) {
          executors.push(co.user)
        }
      })
    }
    return executors
  }

  // Get signed executors
  const getSignedExecutors = () => {
    if (!document || !document.signatures) return []
    return document.signatures.map(sig => sig.user)
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

  // Get approval progress steps
  const getApprovalSteps = () => {
    if (!document) return []
    
    const steps = []
    
    // 1. Создан менеджером - всегда completed
    steps.push({
      label: 'Создан менеджером',
      status: 'completed',
      date: document.creation,
      icon: FileText,
    })
    
    // 2. Обработан в приёмной
    if (document.reception_user && document.reception_decision_date) {
      steps.push({
        label: 'Обработан в приёмной',
        status: 'completed',
        date: document.reception_decision_date,
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
    if (document.reception_user && document.reception_decision_date) {
      if (document.director_approved) {
        steps.push({
          label: 'Согласован директором',
          status: 'completed',
          date: document.director_decision_date || undefined,
          icon: CheckCircle2,
        })
      } else if (document.director_rejected) {
        steps.push({
          label: 'Отказан директором',
          status: 'rejected',
          date: document.director_decision_date || undefined,
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
    if (allExecutors.length > 0 && (document.director_approved || document.reception_user)) {
      const progress = getSignatureProgress()
      if (document.status === 'Выполнено') {
        steps.push({
          label: `Подписание исполнителями (${progress.signed}/${progress.total})`,
          status: 'completed',
          date: document.modified,
          icon: Users,
        })
      } else if (document.status === 'На исполнении') {
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
    if (document.status === 'Выполнено') {
      steps.push({
        label: 'Выполнено',
        status: 'completed',
        date: document.modified,
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-lg text-muted-foreground">Загрузка документа...</div>
        </div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <div className="text-lg text-destructive mb-4">
          {error || 'Документ не найден'}
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/edo_documents'}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться к списку
        </Button>
      </div>
    )
  }

  const approvalSteps = getApprovalSteps()
  const signatureProgress = getSignatureProgress()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
        <Button
          variant="ghost"
          onClick={() => window.location.href = '/edo_documents'}
          className="mb-4 hover:bg-white/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к списку
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {document.title || document.name}
            </h1>
            {document.incoming_number && (
              <p className="text-sm text-muted-foreground font-mono">#{document.incoming_number}</p>
            )}
          </div>
          <Badge className={`text-sm px-4 py-2 shadow-lg ${getStatusColor(document.status)}`}>
            {document.status_name || document.status}
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      {document.status !== 'Отказан' && (
        <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Процесс согласования
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {approvalSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={index} className="flex items-start gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className={`relative p-2 rounded-full transition-all ${
                        step.status === 'completed' 
                          ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500' 
                          : step.status === 'rejected'
                          ? 'bg-red-100 dark:bg-red-900/30 ring-2 ring-red-500'
                          : 'bg-gray-100 dark:bg-gray-800 ring-2 ring-gray-300 dark:ring-gray-700'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          step.status === 'completed' 
                            ? 'text-green-600 dark:text-green-400' 
                            : step.status === 'rejected'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-400'
                        }`} />
                      </div>
                      {index < approvalSteps.length - 1 && (
                        <div className={`w-0.5 h-12 mt-2 transition-all ${
                          step.status === 'completed' 
                            ? 'bg-gradient-to-b from-green-500 to-green-300' 
                            : step.status === 'rejected'
                            ? 'bg-gradient-to-b from-red-500 to-red-300'
                            : 'bg-gray-300 dark:bg-gray-700'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className={`font-semibold text-base transition-colors ${
                        step.status === 'completed' 
                          ? 'text-green-700 dark:text-green-400' 
                          : step.status === 'rejected'
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                      {step.date && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
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

      {/* Action Buttons - Debug Info (always visible for troubleshooting) */}
      <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
        <p><strong>🔍 Debug Info:</strong></p>
        <p>canDirectorApprove: <strong>{canDirectorApprove ? '✅ true' : '❌ false'}</strong></p>
        <p>canExecutorSign: <strong>{canExecutorSign ? '✅ true' : '❌ false'}</strong></p>
        <p>document.status: <strong>"{document?.status || 'undefined'}"</strong></p>
        <p>document.status_name: <strong>"{document?.status_name || 'undefined'}"</strong></p>
        <p>Status === 'Новый': <strong>{document?.status === 'Новый' ? '✅' : '❌'}</strong></p>
        <p>status_name === 'Новый': <strong>{document?.status_name === 'Новый' ? '✅' : '❌'}</strong></p>
        <p>Should show approve button: <strong>{(canDirectorApprove && document && (document.status === 'Новый' || document.status_name === 'Новый')) ? '✅ YES' : '❌ NO'}</strong></p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-4">
        {canDirectorApprove && document && (document.status === 'Новый' || document.status_name === 'Новый') && (
            <>
              <Button 
                onClick={() => setApproveDialogOpen(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Согласовать
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setRejectDialogOpen(true)}
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Отказать
              </Button>
            </>
        )}
        {canExecutorSign && document && (document.status === 'На исполнении' || document.status_name === 'На исполнении') && (
          <Button 
            onClick={() => setSignDialogOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            <PenTool className="w-5 h-5 mr-2" />
            Подписать документ
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('document')}
            className={`relative px-6 py-3 font-medium transition-all duration-300 ${
              activeTab === 'document'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Документ
            {activeTab === 'document' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('signatures')}
            className={`relative px-6 py-3 font-medium transition-all duration-300 ${
              activeTab === 'signatures'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Подписи ({signatureProgress.signed}/{signatureProgress.total})
            {activeTab === 'signatures' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`relative px-6 py-3 font-medium transition-all duration-300 ${
              activeTab === 'history'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="w-4 h-4 inline mr-2" />
            История
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {activeTab === 'document' && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              {document.brief_content && (
                <Card className="border-2 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Краткое содержание
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                      {document.brief_content}
                    </p>
                  </CardContent>
                </Card>
              )}

              {document.document_type_name && (
                <Card className="border-2 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      Тип документа
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {document.document_type_name}
                    </p>
                  </CardContent>
                </Card>
              )}

              {document.executor && (
                <Card className="border-2 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Исполнители
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {document.executor_full_name && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                          {document.executor_full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">Исполнитель</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{document.executor_full_name}</p>
                        </div>
                      </div>
                    )}
                    {document.co_executors && document.co_executors.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Соисполнители:</p>
                        <div className="space-y-2">
                          {document.co_executors.map((co, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                                {(co.user_full_name || co.user).charAt(0).toUpperCase()}
                              </div>
                              <p className="text-gray-700 dark:text-gray-300">{co.user_full_name || co.user}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {document.director_comment && (
                <Card className="border-2 shadow-md hover:shadow-lg transition-shadow border-blue-200 dark:border-blue-800">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      Комментарий директора
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                      {document.director_comment}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="border-2 shadow-md sticky top-6">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-600" />
                    Информация
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">ID документа</p>
                    <p className="font-mono text-sm font-semibold">{document.name}</p>
                  </div>

                  {document.incoming_date && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Входящая дата</p>
                        <p className="font-medium">{new Date(document.incoming_date).toLocaleDateString('ru-RU')}</p>
                      </div>
                    </div>
                  )}

                  {document.outgoing_date && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Исходящая дата</p>
                        <p className="font-medium">{new Date(document.outgoing_date).toLocaleDateString('ru-RU')}</p>
                      </div>
                    </div>
                  )}

                  {document.creation && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Создан</p>
                        <p className="font-medium text-sm">{new Date(document.creation).toLocaleString('ru-RU')}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'signatures' && (
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Подписи исполнителей
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {signatureProgress.total > 0 ? (
                <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Прогресс подписания</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {signatureProgress.signed} из {signatureProgress.total}
                    </span>
                  </div>
                  <Progress value={signatureProgress.percentage} className="h-3" />
                </div>
              ) : (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                  <p className="text-sm text-muted-foreground text-center">
                    Исполнители не назначены для этого документа
                  </p>
                </div>
              )}
              <div className="space-y-4">
                {getAllExecutors().length > 0 ? getAllExecutors().map((executorId) => {
                  const signature = document.signatures?.find(sig => sig.user === executorId)
                  const executorInfo = document.executor === executorId
                    ? { name: document.executor_full_name || executorId, image: document.executor_image }
                    : document.co_executors?.find(co => co.user === executorId)
                      ? { name: document.co_executors.find(co => co.user === executorId)?.user_full_name || executorId, image: document.co_executors.find(co => co.user === executorId)?.user_image }
                      : { name: executorId, image: undefined }

                  return (
                    <div 
                      key={executorId} 
                      className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all ${
                        signature 
                          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 shadow-md' 
                          : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-md'
                      }`}
                    >
                      {executorInfo.image ? (
                        <img src={executorInfo.image} alt={executorInfo.name} className="w-14 h-14 rounded-full ring-2 ring-offset-2 ring-blue-500" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg ring-2 ring-offset-2 ring-blue-500">
                          {executorInfo.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{executorInfo.name}</p>
                        {signature ? (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <p className="flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              Подписан: {signature.signed_at ? new Date(signature.signed_at).toLocaleString('ru-RU') : ''}
                            </p>
                            {signature.comment && (
                              <p className="mt-2 p-2 bg-white dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
                                {signature.comment}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">Ожидает подписания</p>
                        )}
                      </div>
                      {signature ? (
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                        </div>
                      )}
                    </div>
                  )
                }) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Нет назначенных исполнителей</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'history' && (
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-gray-600" />
                История изменений
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {approvalSteps.map((step, index) => {
                  const Icon = step.icon
                  return (
                    <div key={index} className="flex items-start gap-4 pb-6 border-b last:border-0 last:pb-0">
                      <div className={`p-2 rounded-full ${
                        step.status === 'completed' 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : step.status === 'rejected'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          step.status === 'completed' 
                            ? 'text-green-600 dark:text-green-400' 
                            : step.status === 'rejected'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${
                          step.status === 'completed' 
                            ? 'text-green-700 dark:text-green-400' 
                            : step.status === 'rejected'
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {step.label}
                        </p>
                        {step.date && (
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
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

      {/* Dialogs */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              Согласовать документ
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Вы уверены, что хотите согласовать этот документ? После согласования документ будет отправлен исполнителям.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Комментарий (необязательно)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Введите комментарий..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={actionLoading}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {actionLoading ? 'Согласование...' : 'Согласовать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <XCircle className="w-6 h-6 text-red-600" />
              Отказать в согласовании
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Вы уверены, что хотите отказать в согласовании этого документа? После отказа документ не будет отправлен исполнителям.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Причина отказа</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Укажите причину отказа..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={actionLoading}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
            >
              {actionLoading ? 'Отказ...' : 'Отказать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <PenTool className="w-6 h-6 text-blue-600" />
              Подписать документ
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Подписав документ, вы подтверждаете, что ознакомились с его содержанием и готовы приступить к исполнению.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Комментарий (необязательно)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Введите комментарий..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleSign} 
              disabled={actionLoading}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
            >
              {actionLoading ? 'Подписание...' : 'Подписать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
