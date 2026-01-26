import { useState, useEffect } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  api,
  type EDODocument,
  type EDOCorrespondent,
  type EDODocumentType,
  type EDOPriority,
  type EDOClassification,
  type EDODeliveryMethod,
  type EDOAttachment,
  type User,
} from '../lib/api'
import { AddCorrespondentDialog } from './AddCorrespondentDialog'
import { UserSelect, UserMultiSelect } from './ui/user-select'

interface AddDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDocumentCreated?: (doc: EDODocument) => void
  editDocument?: EDODocument | null
  onDocumentUpdated?: (doc: EDODocument) => void
}

export function AddDocumentDialog({
  open,
  onOpenChange,
  onDocumentCreated,
  editDocument,
  onDocumentUpdated,
}: AddDocumentDialogProps) {
  const isEditMode = !!editDocument
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showAddCorrespondent, setShowAddCorrespondent] = useState(false)

  // Form data
  const [incomingNumber, setIncomingNumber] = useState('')
  const [incomingDate, setIncomingDate] = useState('')
  const [outgoingNumber, setOutgoingNumber] = useState('')
  const [outgoingDate, setOutgoingDate] = useState('')
  const [title, setTitle] = useState('')
  const [correspondent, setCorrespondent] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [priority, setPriority] = useState('Стандартный')
  const [briefContent, setBriefContent] = useState('')
  const [classification, setClassification] = useState('Открыто')
  const [deliveryMethod, setDeliveryMethod] = useState('')
  const [mainDocument, setMainDocument] = useState<File | null>(null)
  const [attachments, setAttachments] = useState<File[]>([])
  // Existing files for edit mode
  const [existingMainDocument, setExistingMainDocument] = useState<string | null>(null)
  const [existingAttachments, setExistingAttachments] = useState<EDOAttachment[]>([])
  const [executor, setExecutor] = useState('')
  const [coExecutors, setCoExecutors] = useState<string[]>([])

  // Reference data
  const [correspondents, setCorrespondents] = useState<EDOCorrespondent[]>([])
  const [documentTypes, setDocumentTypes] = useState<EDODocumentType[]>([])
  const [priorities, setPriorities] = useState<EDOPriority[]>([])
  const [classifications, setClassifications] = useState<EDOClassification[]>([])
  const [deliveryMethods, setDeliveryMethods] = useState<EDODeliveryMethod[]>([])
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    if (open) {
      loadReferenceData()
      if (editDocument) {
        // Load document data for editing
        setIncomingNumber(editDocument.incoming_number || '')
        setIncomingDate(editDocument.incoming_date || '')
        setOutgoingNumber(editDocument.outgoing_number || '')
        setOutgoingDate(editDocument.outgoing_date || '')
        setTitle(editDocument.title || '')
        setCorrespondent(editDocument.correspondent || '')
        setDocumentType(editDocument.document_type || '')
        setPriority(editDocument.priority || '')
        setBriefContent(editDocument.brief_content || '')
        setClassification(editDocument.classification || '')
        setDeliveryMethod(editDocument.delivery_method || '')
        setExecutor(editDocument.executor || '')
        setCoExecutors(editDocument.co_executors?.map(c => c.user) || [])
        // Load existing files
        setExistingMainDocument(editDocument.main_document || null)
        setExistingAttachments(editDocument.attachments || [])
      } else {
        // Set current date as incoming date for new documents
        setIncomingDate(new Date().toISOString().split('T')[0])
      }
    }
  }, [open, editDocument])

  const loadReferenceData = async () => {
    try {
      const [corrs, types, prios, classifs, methods, usersList] = await Promise.all([
        api.getCorrespondents(),
        api.getDocumentTypes(),
        api.getPriorities(),
        api.getClassifications(),
        api.getDeliveryMethods(),
        api.getUsers(),
      ])
      setCorrespondents(corrs)
      setDocumentTypes(types)
      setPriorities(prios)
      setClassifications(classifs)
      setDeliveryMethods(methods)
      setUsers(usersList)
    } catch (error) {
      console.error('Failed to load reference data:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMainDocument(e.target.files[0])
    }
  }

  const handleAttachmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments([...attachments, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const removeExistingAttachment = (index: number) => {
    setExistingAttachments(existingAttachments.filter((_, i) => i !== index))
  }

  const handleCorrespondentCreated = async (newCorrespondent: EDOCorrespondent) => {
    // Reload correspondents list
    const corrs = await api.getCorrespondents()
    setCorrespondents(corrs)
    // Select the newly created correspondent
    setCorrespondent(newCorrespondent.name)
  }

  const handleSubmit = async () => {
    if (!correspondent || !documentType) {
      alert('Заполните обязательные поля')
      return
    }

    setLoading(true)
    try {
      setUploading(true)

      // Upload main document (only if new file selected)
      let fileUrl = existingMainDocument || ''
      if (mainDocument) {
        fileUrl = await api.uploadFile(mainDocument)
      }

      // Upload new attachments
      const attachmentUrls: EDOAttachment[] = []
      for (const file of attachments) {
        const url = await api.uploadFile(file)
        attachmentUrls.push({
          attachment: url,
          file_name: file.name,
          file_size: file.size
        })
      }

      // Keep existing attachments (user may have removed some) and add new ones
      const allAttachments = [...existingAttachments, ...attachmentUrls]

      setUploading(false)

      const docData = {
        incoming_number: incomingNumber || undefined,
        incoming_date: incomingDate || undefined,
        outgoing_number: outgoingNumber || undefined,
        outgoing_date: outgoingDate || undefined,
        title: title || undefined,
        correspondent,
        document_type: documentType,
        priority: priority || undefined,
        brief_content: briefContent || undefined,
        classification: classification || undefined,
        delivery_method: deliveryMethod || undefined,
        main_document: fileUrl || undefined,
        attachments: allAttachments.length > 0 ? allAttachments : undefined,
        executor: executor || undefined,
        co_executors: coExecutors.length > 0 ? coExecutors.map(user => ({ user })) : undefined,
      }

      if (isEditMode && editDocument) {
        const updatedDoc = await api.updateDocument(editDocument.name, docData)
        onDocumentUpdated?.(updatedDoc)
      } else {
        const newDoc = await api.createDocument(docData)
        onDocumentCreated?.(newDoc)
      }

      resetForm()
      onOpenChange(false)
    } catch (error: any) {
      console.error(isEditMode ? 'Failed to update document:' : 'Failed to create document:', error)
      let errorMessage = isEditMode ? 'Ошибка при обновлении документа' : 'Ошибка при создании документа'
      if (error?.message) {
        errorMessage += ': ' + error.message
      }
      alert(errorMessage)
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const resetForm = () => {
    setIncomingNumber('')
    setIncomingDate('')
    setOutgoingNumber('')
    setOutgoingDate('')
    setTitle('')
    setCorrespondent('')
    setDocumentType('')
    setPriority('Стандартный')
    setBriefContent('')
    setClassification('Открыто')
    setDeliveryMethod('')
    setMainDocument(null)
    setAttachments([])
    setExecutor('')
    setCoExecutors([])
    setExistingMainDocument(null)
    setExistingAttachments([])
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">{isEditMode ? 'Редактирование документа' : 'Новый документ'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Основная информация */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Основная информация</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="incoming_number">
                    Входящий номер <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="incoming_number"
                    placeholder="Введите номер"
                    value={incomingNumber}
                    onChange={(e) => setIncomingNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incoming_date">
                    Входящая дата <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="incoming_date"
                    type="date"
                    value={incomingDate}
                    onChange={(e) => setIncomingDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="outgoing_number">Исходящий номер</Label>
                  <Input
                    id="outgoing_number"
                    placeholder="Введите номер"
                    value={outgoingNumber}
                    onChange={(e) => setOutgoingNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outgoing_date">Исходящая дата</Label>
                  <Input
                    id="outgoing_date"
                    type="date"
                    placeholder="дд.мм.гггг"
                    value={outgoingDate}
                    onChange={(e) => setOutgoingDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Название документа</Label>
                <Input
                  id="title"
                  placeholder="Введите название документа"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="correspondent">
                  Корреспондент <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Select value={correspondent} onValueChange={setCorrespondent}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Введите название организации" />
                    </SelectTrigger>
                    <SelectContent>
                      {correspondents.map((corr) => (
                        <SelectItem key={corr.name} value={corr.name}>
                          {corr.correspondent_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setShowAddCorrespondent(true)}
                  >
                    Добавить
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brief_content">
                  Краткое содержание <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="brief_content"
                  placeholder="Введите краткое содержание документа"
                  rows={3}
                  value={briefContent}
                  onChange={(e) => setBriefContent(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document_type">
                    Вид документа <span className="text-red-500">*</span>
                  </Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите вид" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.name} value={type.name}>
                          {type.document_type_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Приоритет</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Стандартный" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((prio) => (
                        <SelectItem key={prio.name} value={prio.name}>
                          {prio.priority_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Исполнители */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Исполнители</h3>

              <div className="space-y-2">
                <Label>Исполнитель</Label>
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

            {/* Дополнительная информация */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Дополнительная информация</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_method">Способ доставки</Label>
                  <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите способ" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryMethods.map((method) => (
                        <SelectItem key={method.name} value={method.name}>
                          {method.delivery_method_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classification">Гриф</Label>
                  <Select value={classification} onValueChange={setClassification}>
                    <SelectTrigger>
                      <SelectValue placeholder="Открыто" />
                    </SelectTrigger>
                    <SelectContent>
                      {classifications.map((classif) => (
                        <SelectItem key={classif.name} value={classif.name}>
                          {classif.classification_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - File upload and reference */}
          <div className="space-y-6">
            {/* Файл документа */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Файл документа</h3>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  Перетащите файл сюда или нажмите для выбора
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  PDF, DOC, DOCX до 10 МБ
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Выбрать файл
                </Button>
                {/* Show existing main document in edit mode */}
                {existingMainDocument && !mainDocument && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-900 truncate">
                        {existingMainDocument.split('/').pop()}
                      </p>
                      <p className="text-xs text-green-600">Текущий файл</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExistingMainDocument(null)}
                      className="text-green-600 hover:text-red-600"
                      title="Удалить файл"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {/* Show newly selected file */}
                {mainDocument && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900 truncate">
                        {mainDocument.name}
                      </p>
                      <p className="text-xs text-blue-600">
                        {(mainDocument.size / 1024).toFixed(1)} КБ (новый)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMainDocument(null)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Вложения */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Вложения</h3>
              <div className="space-y-2">
                <input
                  type="file"
                  id="attachments-upload"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleAttachmentsChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => document.getElementById('attachments-upload')?.click()}
                >
                  Добавить файлы
                </Button>
                {/* Existing attachments */}
                {existingAttachments.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <p className="text-xs text-muted-foreground">Текущие вложения:</p>
                    {existingAttachments.map((att, index) => (
                      <div
                        key={`existing-${index}`}
                        className="p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-green-900 truncate">{att.file_name}</p>
                          {att.file_size && (
                            <p className="text-xs text-green-600">
                              {(att.file_size / 1024).toFixed(1)} КБ
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingAttachment(index)}
                          className="text-green-600 hover:text-red-600"
                          title="Удалить вложение"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* New attachments */}
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <p className="text-xs text-muted-foreground">Новые вложения:</p>
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="p-2 bg-blue-50 border border-blue-200 rounded flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-blue-900 truncate">{file.name}</p>
                          <p className="text-xs text-blue-600">
                            {(file.size / 1024).toFixed(1)} КБ
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-blue-600 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Справка */}
            <div className="space-y-3 text-sm">
              <h3 className="text-base font-semibold">Справка</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong>Входящий номер:</strong> Присваивается автоматически при
                  регистрации
                </p>
                <p>
                  <strong>Корреспондент:</strong> Можно указать несколько организаций
                </p>
                <p>
                  <strong>Электронная отметка:</strong> Ставится после регистрации
                  документа
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
          >
            Отмена
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={loading}>
              Сохранить черновик
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploading ? 'Загрузка файла...' : loading ? (isEditMode ? 'Сохранение...' : 'Создание...') : (isEditMode ? 'Сохранить' : 'Зарегистрировать')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <AddCorrespondentDialog
      open={showAddCorrespondent}
      onOpenChange={setShowAddCorrespondent}
      onCorrespondentCreated={handleCorrespondentCreated}
    />
    </>
  )
}
