import { useState, useEffect } from 'react'
import { Download, Printer, User, Users, Edit, CheckCircle2, XCircle, PenTool, FileCheck, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { UserSelect, UserMultiSelect } from './ui/user-select'
import type { EDODocument, EDOResolution, User as UserType } from '../lib/api'
import { api } from '../lib/api'

interface DocumentMetadataProps {
  document: EDODocument | null
  canEdit?: boolean
  onEdit?: () => void
  onDocumentUpdate?: (doc: EDODocument) => void
}

export function DocumentMetadata({ document, canEdit = false, onEdit, onDocumentUpdate }: DocumentMetadataProps) {
  const { t, i18n } = useTranslation()
  const [canDirectorApprove, setCanDirectorApprove] = useState(false)
  const [canExecutorSign, setCanExecutorSign] = useState(false)
  const [canReceptionSubmit, setCanReceptionSubmit] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [signDialogOpen, setSignDialogOpen] = useState(false)
  const [receptionDialogOpen, setReceptionDialogOpen] = useState(false)
  const [directorEditDialogOpen, setDirectorEditDialogOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  
  // Reception dialog state
  const [resolution, setResolution] = useState('')
  const [resolutionText, setResolutionText] = useState('')
  const [useCustomResolution, setUseCustomResolution] = useState(false)
  const [executor, setExecutor] = useState('')
  const [coExecutors, setCoExecutors] = useState<string[]>([])
  const [resolutions, setResolutions] = useState<EDOResolution[]>([])
  const [users, setUsers] = useState<UserType[]>([])

  useEffect(() => {
    if (document) {
      checkPermissions()
    }
  }, [document?.name, document?.status, document?.director_approved, document?.director_rejected])

  const checkPermissions = async () => {
    if (!document) return
    try {
      const [canApprove, canSign, canReception] = await Promise.all([
        api.canDirectorApprove(),
        api.canExecutorSign(document.name),
        api.canReceptionSubmit(),
      ])
      setCanDirectorApprove(canApprove)
      setCanExecutorSign(canSign)
      setCanReceptionSubmit(canReception)
      
      // Load data for reception dialog if needed (reception or director)
      if ((canReception && document.status === 'Новый') || (canApprove && document.status === 'На рассмотрении')) {
        const [resolutionsData, usersData] = await Promise.all([
          api.getResolutions(),
          api.getUsers(),
        ])
        setResolutions(resolutionsData)
        setUsers(usersData)
      }
    } catch (err) {
      console.error('Failed to check permissions:', err)
    }
  }

  const handleApprove = async () => {
    if (!document) return
    try {
      setActionLoading(true)
      await api.directorApproveDocument(document.name, comment)
      setApproveDialogOpen(false)
      setComment('')
      // Force reload document after approval
      if (onDocumentUpdate) {
        const updated = await api.getDocument(document.name)
        onDocumentUpdate(updated)
      }
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
      await api.directorRejectDocument(document.name, comment)
      setRejectDialogOpen(false)
      setComment('')
      // Force reload document after rejection
      if (onDocumentUpdate) {
        const updated = await api.getDocument(document.name)
        onDocumentUpdate(updated)
      }
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
      await api.executorSignDocument(document.name, comment)
      setSignDialogOpen(false)
      setComment('')
      // Force reload document after signing
      if (onDocumentUpdate) {
        const updated = await api.getDocument(document.name)
        onDocumentUpdate(updated)
      }
      await checkPermissions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка при подписании')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReceptionSubmit = async () => {
    if (!document) return
    if (!useCustomResolution && !resolution) {
      alert('Выберите резолюцию или введите текст резолюции')
      return
    }
    if (useCustomResolution && !resolutionText.trim()) {
      alert('Введите текст резолюции')
      return
    }
    if (!executor) {
      alert('Выберите исполнителя')
      return
    }
    try {
      setActionLoading(true)
      await api.receptionSubmitToDirector(
        document.name, 
        useCustomResolution ? undefined : resolution,
        useCustomResolution ? resolutionText : undefined,
        executor, 
        coExecutors
      )
      setReceptionDialogOpen(false)
      setResolution('')
      setResolutionText('')
      setUseCustomResolution(false)
      setExecutor('')
      setCoExecutors([])
      // Force reload document after submission
      if (onDocumentUpdate) {
        const updated = await api.getDocument(document.name)
        onDocumentUpdate(updated)
      }
      await checkPermissions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка при отправке директору')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDirectorEdit = async () => {
    if (!document) return
    if (!useCustomResolution && !resolution) {
      alert('Выберите резолюцию или введите текст резолюции')
      return
    }
    if (useCustomResolution && !resolutionText.trim()) {
      alert('Введите текст резолюции')
      return
    }
    if (!executor) {
      alert('Выберите исполнителя')
      return
    }
    try {
      setActionLoading(true)
      // Update document with new resolution and executors
      await api.updateDocument(document.name, {
        resolution: useCustomResolution ? undefined : resolution,
        resolution_text: useCustomResolution ? resolutionText : undefined,
        executor: executor,
        co_executors: coExecutors.map(user => ({ user }))
      })
      setDirectorEditDialogOpen(false)
      setResolution('')
      setResolutionText('')
      setUseCustomResolution(false)
      setExecutor('')
      setCoExecutors([])
      // Force reload document after update
      if (onDocumentUpdate) {
        const updated = await api.getDocument(document.name)
        onDocumentUpdate(updated)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка при обновлении резолюции и исполнителей')
    } finally {
      setActionLoading(false)
    }
  }

  if (!document) {
    return null
  }

  const getStatusColor = (status: string) => {
    if (status === t('documents.status.signed') || status === 'Подписан' || status === 'Выполнено' || status === 'Согласован') {
      return 'text-green-600'
    }
    if (status === t('documents.status.pending') || status === 'На подписании' || status === 'На исполнении') {
      return 'text-orange-500'
    }
    if (status === t('documents.status.archived') || status === 'Архив') {
      return 'text-gray-500'
    }
    if (status === 'Отказан') {
      return 'text-red-600'
    }
    return 'text-gray-500'
  }

  const formatDate = (dateStr: string) => {
    const locale = i18n.language === 'uz' ? 'uz-UZ' : i18n.language === 'en' ? 'en-US' : 'ru-RU'
    return new Date(dateStr).toLocaleDateString(locale)
  }

  const isNewStatus = document.status === 'Новый'
  const isInExecution = document.status === 'На исполнении'
  const isOnReview = document.status === 'На рассмотрении'

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-4 space-y-6">
        {/* Document info header */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {t('documentMetadata.documentInfo')}
          </h3>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">{t('documentMetadata.documentNumber')}</p>
              <p className="font-medium">{document.name}</p>
            </div>

            {document.title && (
              <div className="col-span-2">
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
                {document.status}
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
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Дата создания</p>
                <p className="font-medium">{formatDate(document.creation)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Resolution section - красивый блок резолюции */}
        {(document.resolution_name || document.resolution_text || document.resolution_text_from_link) && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Резолюция
            </h3>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg border border-purple-200 dark:border-purple-800 p-4 space-y-4">
              {(document.resolution_name || document.resolution_text || document.resolution_text_from_link) && (
                <div className="space-y-2">
                  {document.resolution_name && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        {document.resolution_name}
                      </p>
                    </div>
                  )}
                  {(document.resolution_text || document.resolution_text_from_link) && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 pl-6 whitespace-pre-wrap">
                      {document.resolution_text_from_link || document.resolution_text}
                    </p>
                  )}
                </div>
              )}
              
              {/* Исполнитель и соисполнители внутри блока резолюции */}
              {(document.executor || (document.co_executors && document.co_executors.length > 0)) && (
                <div className="pt-3 border-t border-purple-200 dark:border-purple-800 space-y-3">
                  {document.executor && (
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {document.executor_image ? (
                          <img
                            src={document.executor_image}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border-2 border-purple-300 dark:border-purple-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center border-2 border-purple-300 dark:border-purple-700">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {document.executor_full_name || document.executor}
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-400">Исполнитель</p>
                      </div>
                    </div>
                  )}

                  {document.co_executors && document.co_executors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-purple-700 dark:text-purple-300 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Соисполнители ({document.co_executors.length})
                      </p>
                      <div className="space-y-2 pl-2">
                        {document.co_executors.map((coExec, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {coExec.user_image ? (
                                <img
                                  src={coExec.user_image}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-purple-200 dark:border-purple-800"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-purple-400 dark:bg-purple-600 flex items-center justify-center border border-purple-200 dark:border-purple-800">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {coExec.user_full_name || coExec.user}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Executors section - показываем только если нет резолюции */}
        {!(document.resolution_name || document.resolution_text || document.resolution_text_from_link) && 
         (document.executor || (document.co_executors && document.co_executors.length > 0)) && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Исполнители
            </h3>
            <div className="space-y-3">
              {document.executor && (
                <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                  {document.executor_image ? (
                    <img
                      src={document.executor_image}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{document.executor_full_name || document.executor}</p>
                    <p className="text-xs text-blue-600">Исполнитель</p>
                  </div>
                </div>
              )}

              {document.co_executors && document.co_executors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Соисполнители ({document.co_executors.length})
                  </p>
                  {document.co_executors.map((coExec, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      {coExec.user_image ? (
                        <img
                          src={coExec.user_image}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center">
                          <User className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <p className="text-sm">{coExec.user_full_name || coExec.user}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Brief content */}
        {document.brief_content && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Краткое содержание
            </h3>
            <p className="text-sm whitespace-pre-wrap">{document.brief_content}</p>
          </div>
        )}

        {/* Director comment */}
        {document.director_comment && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Комментарий директора
            </h3>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm whitespace-pre-wrap">{document.director_comment}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {t('documentMetadata.actions')}
          </h3>
          <div className="space-y-2">
            {/* Reception submit button */}
            {canReceptionSubmit && isNewStatus && (
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-md" 
                size="sm"
                onClick={() => setReceptionDialogOpen(true)}
              >
                <FileCheck className="w-4 h-4 mr-2" />
                Обработать в приёмной
              </Button>
            )}

            {/* Director buttons */}
            {canDirectorApprove && isOnReview && (
              <>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-md" 
                  size="sm"
                  onClick={() => {
                    // Pre-fill dialog with current values
                    if (document.resolution) {
                      setResolution(document.resolution)
                      setUseCustomResolution(false)
                    } else if (document.resolution_text) {
                      setResolutionText(document.resolution_text)
                      setUseCustomResolution(true)
                    }
                    setExecutor(document.executor || '')
                    setCoExecutors(document.co_executors?.map((ce: any) => ce.user).filter(Boolean) || [])
                    setDirectorEditDialogOpen(true)
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Изменить резолюцию и исполнителей
                </Button>
                <Button 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md" 
                  size="sm"
                  onClick={() => setApproveDialogOpen(true)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Согласовать
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-md" 
                  size="sm"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Отказать
                </Button>
              </>
            )}

            {/* Executor sign button */}
            {canExecutorSign && isInExecution && (
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-md" 
                size="sm"
                onClick={() => setSignDialogOpen(true)}
              >
                <PenTool className="w-4 h-4 mr-2" />
                Подписать документ
              </Button>
            )}

            {canEdit && (
              <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4" />
                Редактировать
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
          </div>
        </div>
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

      {/* Director edit dialog - same as reception dialog but for director */}
      <Dialog open={directorEditDialogOpen} onOpenChange={setDirectorEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Edit className="w-6 h-6 text-purple-600" />
              Изменить резолюцию и исполнителей
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Измените резолюцию и назначьте исполнителей для этого документа.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="use_custom_resolution_director"
                  checked={useCustomResolution}
                  onChange={(e) => {
                    setUseCustomResolution(e.target.checked)
                    if (e.target.checked) {
                      setResolution('')
                    } else {
                      setResolutionText('')
                    }
                  }}
                  className="w-4 h-4"
                />
                <Label htmlFor="use_custom_resolution_director" className="cursor-pointer">
                  Ввести резолюцию вручную
                </Label>
              </div>
              
              {!useCustomResolution ? (
                <>
                  <Label htmlFor="resolution_director">Резолюция *</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите резолюцию" />
                    </SelectTrigger>
                    <SelectContent>
                      {resolutions.map((res) => (
                        <SelectItem key={res.name} value={res.name}>
                          {res.resolution_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <>
                  <Label htmlFor="resolution_text_director">Текст резолюции *</Label>
                  <Textarea
                    id="resolution_text_director"
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Введите текст резолюции..."
                    rows={4}
                    className="resize-none"
                  />
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label>Исполнитель *</Label>
              <UserSelect
                users={users}
                value={executor}
                onChange={setExecutor}
                placeholder="Поиск исполнителя..."
              />
            </div>

            <div className="space-y-2">
              <Label>Соисполнители</Label>
              <UserMultiSelect
                users={users}
                value={coExecutors}
                onChange={setCoExecutors}
                excludeUsers={executor ? [executor] : []}
                placeholder="Поиск соисполнителей..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDirectorEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleDirectorEdit} 
              disabled={actionLoading || (!useCustomResolution && !resolution) || (useCustomResolution && !resolutionText.trim()) || !executor}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              {actionLoading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={receptionDialogOpen} onOpenChange={setReceptionDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileCheck className="w-6 h-6 text-purple-600" />
              Обработка в приёмной
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Назначьте исполнителей и выберите резолюцию для передачи документа директору.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="use_custom_resolution"
                  checked={useCustomResolution}
                  onChange={(e) => {
                    setUseCustomResolution(e.target.checked)
                    if (e.target.checked) {
                      setResolution('')
                    } else {
                      setResolutionText('')
                    }
                  }}
                  className="w-4 h-4"
                />
                <Label htmlFor="use_custom_resolution" className="cursor-pointer">
                  Написать резолюцию вручную
                </Label>
              </div>
              
              {!useCustomResolution ? (
                <>
                  <Label htmlFor="resolution">Резолюция *</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите резолюцию" />
                    </SelectTrigger>
                    <SelectContent>
                      {resolutions.map((res) => (
                        <SelectItem key={res.name} value={res.name}>
                          {res.resolution_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <>
                  <Label htmlFor="resolution_text">Текст резолюции *</Label>
                  <Textarea
                    id="resolution_text"
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Введите текст резолюции..."
                    rows={4}
                    className="resize-none"
                  />
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label>Исполнитель *</Label>
              <UserSelect
                users={users}
                value={executor}
                onChange={setExecutor}
                placeholder="Поиск исполнителя..."
              />
            </div>

            <div className="space-y-2">
              <Label>Соисполнители</Label>
              <UserMultiSelect
                users={users}
                value={coExecutors}
                onChange={setCoExecutors}
                excludeUsers={executor ? [executor] : []}
                placeholder="Поиск соисполнителей..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceptionDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleReceptionSubmit} 
              disabled={actionLoading || (!useCustomResolution && !resolution) || (useCustomResolution && !resolutionText.trim()) || !executor}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              {actionLoading ? 'Отправка...' : 'Отправить директору'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
