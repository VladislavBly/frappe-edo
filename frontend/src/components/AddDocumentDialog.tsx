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
} from '../lib/api'
import { AddCorrespondentDialog } from './AddCorrespondentDialog'

interface AddDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDocumentCreated?: (doc: EDODocument) => void
}

export function AddDocumentDialog({
  open,
  onOpenChange,
  onDocumentCreated,
}: AddDocumentDialogProps) {
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
  const [notes, setNotes] = useState('')

  // Reference data
  const [correspondents, setCorrespondents] = useState<EDOCorrespondent[]>([])
  const [documentTypes, setDocumentTypes] = useState<EDODocumentType[]>([])
  const [priorities, setPriorities] = useState<EDOPriority[]>([])
  const [classifications, setClassifications] = useState<EDOClassification[]>([])
  const [deliveryMethods, setDeliveryMethods] = useState<EDODeliveryMethod[]>([])

  useEffect(() => {
    if (open) {
      loadReferenceData()
      // Set current date as incoming date
      setIncomingDate(new Date().toISOString().split('T')[0])
    }
  }, [open])

  const loadReferenceData = async () => {
    try {
      const [corrs, types, prios, classifs, methods] = await Promise.all([
        api.getCorrespondents(),
        api.getDocumentTypes(),
        api.getPriorities(),
        api.getClassifications(),
        api.getDeliveryMethods(),
      ])
      setCorrespondents(corrs)
      setDocumentTypes(types)
      setPriorities(prios)
      setClassifications(classifs)
      setDeliveryMethods(methods)
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

      // Upload main document
      let fileUrl = ''
      if (mainDocument) {
        fileUrl = await api.uploadFile(mainDocument)
      }

      // Upload attachments
      const attachmentUrls = []
      for (const file of attachments) {
        const url = await api.uploadFile(file)
        attachmentUrls.push({
          attachment: url,
          file_name: file.name,
          file_size: file.size
        })
      }

      setUploading(false)

      const newDoc = await api.createDocument({
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
        attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
      })

      onDocumentCreated?.(newDoc)
      resetForm()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Failed to create document:', error)
      let errorMessage = 'Ошибка при создании документа'
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
    setNotes('')
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">Новый документ</DialogTitle>
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

              <div className="space-y-2">
                <Label htmlFor="notes">Примечание</Label>
                <Textarea
                  id="notes"
                  placeholder="Дополнительные заметки"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
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
                {mainDocument && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900 truncate">
                        {mainDocument.name}
                      </p>
                      <p className="text-xs text-blue-600">
                        {(mainDocument.size / 1024).toFixed(1)} КБ
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
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="p-2 bg-gray-50 border border-gray-200 rounded flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} КБ
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-gray-400 hover:text-red-600"
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
              {uploading ? 'Загрузка файла...' : loading ? 'Создание...' : 'Зарегистрировать'}
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
