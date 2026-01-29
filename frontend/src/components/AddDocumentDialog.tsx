import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileText, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { api } from '../lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { useUploadFile } from '../api/files/api'
import {
  useCorrespondents,
  useDocumentTypes,
  usePriorities,
  useClassifications,
  useDeliveryMethods,
  useReceptionOffices,
  referenceKeys,
} from '../api/references/api'
import { useUsers } from '../api/users/api'
import { useCurrentUser } from '../api/users/api'
import type { EDODocument, EDOAttachment } from '../api/documents/types'
import type { EDOCorrespondent } from '../api/references/types'
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
  const { t } = useTranslation()
  const isEditMode = !!editDocument
  const [loading, setLoading] = useState(false)
  const uploadFileMutation = useUploadFile()
  const queryClient = useQueryClient()
  const [showAddCorrespondent, setShowAddCorrespondent] = useState(false)

  // Use hooks for reference data
  const { data: correspondentsData = [] } = useCorrespondents()
  const { data: documentTypesData = [] } = useDocumentTypes()
  const { data: prioritiesData = [] } = usePriorities()
  const { data: classificationsData = [] } = useClassifications()
  const { data: deliveryMethodsData = [] } = useDeliveryMethods()
  const { data: receptionOfficesData = [] } = useReceptionOffices()
  const { data: usersData = [] } = useUsers()
  const { data: currentUser } = useCurrentUser()

  // Form data
  const [incomingNumber, setIncomingNumber] = useState('')
  const [incomingDate, setIncomingDate] = useState('')
  const [outgoingNumber, setOutgoingNumber] = useState('')
  const [outgoingDate, setOutgoingDate] = useState('')
  const [title, setTitle] = useState('')
  const [correspondent, setCorrespondent] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [priority, setPriority] = useState('')
  const [briefContent, setBriefContent] = useState('')
  const [classification, setClassification] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('')
  const [receptionOffice, setReceptionOffice] = useState('')
  const [mainDocument, setMainDocument] = useState<File | null>(null)
  const [attachments, setAttachments] = useState<File[]>([])
  // Existing files for edit mode
  const [existingMainDocument, setExistingMainDocument] = useState<string | null>(null)
  const [existingAttachments, setExistingAttachments] = useState<EDOAttachment[]>([])
  const [executor, setExecutor] = useState('')
  const [coExecutors, setCoExecutors] = useState<string[]>([])

  const correspondents = correspondentsData
  const documentTypes = documentTypesData
  const priorities = prioritiesData
  const classifications = classificationsData
  const deliveryMethods = deliveryMethodsData
  const receptionOffices = receptionOfficesData
  const users = usersData
  const userRoles = currentUser?.roles || []

  useEffect(() => {
    if (open) {
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
        setReceptionOffice(editDocument.reception_office || '')
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

  // Определяем, какие поля показывать для разных ролей
  // Приёмная - только для менеджера (чтобы выбрать, куда отправить документ)
  const canSeeReceptionOffice = userRoles.includes('EDO Manager') || userRoles.includes('EDO Admin')

  // Исполнители - только для приемной (чтобы назначить исполнителей)
  const canSeeExecutors = userRoles.includes('EDO Reception') || userRoles.includes('EDO Admin')

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
    // Invalidate correspondents query to refetch
    queryClient.invalidateQueries({ queryKey: referenceKeys.correspondents() })
    // Select the newly created correspondent
    setCorrespondent(newCorrespondent.name)
  }

  const handleSubmit = async () => {
    if (!correspondent || !documentType) {
      alert(t('addDocument.fillRequired'))
      return
    }

    // Reception office is required for Manager (who selects which reception office to send document to)
    if (canSeeReceptionOffice && !receptionOffice) {
      alert(t('addDocument.selectReception'))
      return
    }

    setLoading(true)
    try {
      // Upload main document (only if new file selected)
      let fileUrl = existingMainDocument || ''
      if (mainDocument) {
        fileUrl = await uploadFileMutation.mutateAsync(mainDocument)
      }

      // Upload new attachments
      const attachmentUrls: EDOAttachment[] = []
      for (const file of attachments) {
        const url = await uploadFileMutation.mutateAsync(file)
        attachmentUrls.push({
          attachment: url,
          file_name: file.name,
          file_size: file.size,
        })
      }

      // Keep existing attachments (user may have removed some) and add new ones
      const allAttachments = [...existingAttachments, ...attachmentUrls]

      const docData: any = {
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
      }

      // Reception office - только для менеджера (кто выбирает приемную)
      if (canSeeReceptionOffice && receptionOffice) {
        docData.reception_office = receptionOffice
      }

      // Executors - только для приемной
      if (canSeeExecutors) {
        if (executor) {
          docData.executor = executor
        }
        if (coExecutors.length > 0) {
          docData.co_executors = coExecutors.map(user => ({ user }))
        }
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
      let errorMessage = isEditMode
        ? t('addDocument.errorUpdate')
        : t('addDocument.errorCreate')
      if (error?.message) {
        errorMessage += ': ' + error.message
      }
      alert(errorMessage)
    } finally {
      setLoading(false)
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
    setPriority('')
    setBriefContent('')
    setClassification('')
    setDeliveryMethod('')
    setReceptionOffice('')
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
            <DialogTitle className="text-xl">
              {isEditMode ? t('addDocument.editDocument') : t('addDocument.newDocument')}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Main info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <h3 className="text-base font-semibold">{t('addDocument.mainInfo')}</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="incoming_number">
                      {t('addDocument.incomingNumber')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="incoming_number"
                      placeholder={t('addDocument.numberPlaceholder')}
                      value={incomingNumber}
                      onChange={e => setIncomingNumber(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="incoming_date">
                      {t('addDocument.incomingDate')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="incoming_date"
                      type="date"
                      value={incomingDate}
                      onChange={e => setIncomingDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="outgoing_number">{t('addDocument.outgoingNumber')}</Label>
                    <Input
                      id="outgoing_number"
                      placeholder={t('addDocument.numberPlaceholder')}
                      value={outgoingNumber}
                      onChange={e => setOutgoingNumber(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="outgoing_date">{t('addDocument.outgoingDate')}</Label>
                    <Input
                      id="outgoing_date"
                      type="date"
                      placeholder={t('addDocument.datePlaceholder')}
                      value={outgoingDate}
                      onChange={e => setOutgoingDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">{t('addDocument.documentTitle')}</Label>
                  <Input
                    id="title"
                    placeholder={t('addDocument.titlePlaceholder')}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="correspondent">
                    {t('addDocument.correspondent')} <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select value={correspondent} onValueChange={setCorrespondent}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={t('addDocument.correspondentPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {correspondents.map(corr => (
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
                      {t('addDocument.add')}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brief_content">
                    {t('addDocument.briefContent')} <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="brief_content"
                    placeholder={t('addDocument.briefContentPlaceholder')}
                    rows={3}
                    value={briefContent}
                    onChange={e => setBriefContent(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="document_type">
                      {t('addDocument.documentType')} <span className="text-red-500">*</span>
                    </Label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('addDocument.documentTypePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map(type => (
                          <SelectItem key={type.name} value={type.name}>
                            {type.document_type_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">{t('addDocument.priority')}</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('addDocument.priorityPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(prio => (
                          <SelectItem key={prio.name} value={prio.name}>
                            {prio.priority_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {canSeeExecutors && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold">{t('addDocument.executors')}</h3>

                  <div className="space-y-2">
                    <Label>{t('addDocument.executor')}</Label>
                    <UserSelect
                      users={users}
                      value={executor}
                      onChange={setExecutor}
                      placeholder={t('addDocument.executorSearchPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('addDocument.coExecutors')}</Label>
                    <UserMultiSelect
                      users={users}
                      value={coExecutors}
                      onChange={setCoExecutors}
                      excludeUsers={executor ? [executor] : []}
                      placeholder={t('addDocument.coExecutorsSearchPlaceholder')}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-base font-semibold">{t('addDocument.additionalInfo')}</h3>

                <div className="grid grid-cols-2 gap-4">
                  {canSeeReceptionOffice && (
                    <div className="space-y-2">
                      <Label htmlFor="reception_office">{t('addDocument.receptionOffice')}</Label>
                      <Select value={receptionOffice} onValueChange={setReceptionOffice}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('addDocument.receptionPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {receptionOffices.map(office => (
                            <SelectItem key={office.name} value={office.name}>
                              {office.reception_office_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className={`space-y-2 ${canSeeReceptionOffice ? '' : 'col-span-2'}`}>
                    <Label htmlFor="delivery_method">{t('addDocument.deliveryMethod')}</Label>
                    <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('addDocument.deliveryPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {deliveryMethods.map(method => (
                          <SelectItem key={method.name} value={method.name}>
                            {method.delivery_method_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="classification">{t('addDocument.classification')}</Label>
                    <Select value={classification} onValueChange={setClassification}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('addDocument.classificationPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {classifications.map(classif => (
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
              <div className="space-y-4">
                <h3 className="text-base font-semibold">{t('addDocument.documentFile')}</h3>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {t('addDocument.dragFileHint')}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">{t('addDocument.fileTypesHint')}</p>
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
                    {t('addDocument.selectFile')}
                  </Button>
                  {existingMainDocument && !mainDocument && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-900 truncate">
                          {existingMainDocument.split('/').pop()}
                        </p>
                        <p className="text-xs text-green-600">{t('addDocument.currentFile')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExistingMainDocument(null)}
                        className="text-green-600 hover:text-red-600"
                        title={t('addDocument.deleteFile')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {mainDocument && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-900 truncate">
                          {mainDocument.name}
                        </p>
                        <p className="text-xs text-blue-600">
                          {(mainDocument.size / 1024).toFixed(1)} КБ ({t('addDocument.newFile')})
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

              <div className="space-y-4">
                <h3 className="text-base font-semibold">{t('addDocument.attachments')}</h3>
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
                    {t('addDocument.addFiles')}
                  </Button>
                  {existingAttachments.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <p className="text-xs text-muted-foreground">{t('addDocument.currentAttachments')}</p>
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
                            title={t('addDocument.deleteAttachment')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {attachments.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <p className="text-xs text-muted-foreground">{t('addDocument.newAttachments')}</p>
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

              <div className="space-y-3 text-sm">
                <h3 className="text-base font-semibold">{t('addDocument.help')}</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t('addDocument.helpIncomingNumber')}</p>
                  <p>{t('addDocument.helpCorrespondent')}</p>
                  <p>{t('addDocument.helpStamp')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
            >
              {t('common.cancel')}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={loading}>
                {t('addDocument.saveDraft')}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || uploadFileMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {uploadFileMutation.isPending
                  ? t('addDocument.uploadingFile')
                  : loading
                    ? isEditMode
                      ? t('addDocument.saving')
                      : t('addDocument.creating')
                    : isEditMode
                      ? t('addDocument.save')
                      : t('addDocument.register')}
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
