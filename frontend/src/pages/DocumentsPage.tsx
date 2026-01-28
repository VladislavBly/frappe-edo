import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { DocumentSidebar } from '../components/DocumentSidebar'
import { DocumentContent } from '../components/DocumentContent'
import { DocumentMetadata } from '../components/DocumentMetadata'
import { AddDocumentDialog } from '../components/AddDocumentDialog'
import { useHeader } from '../contexts/HeaderContext'
import { api, type EDODocument } from '../lib/api'

interface DocumentsPageProps {
  canEdit?: boolean
}

export function DocumentsPage({
  canEdit = false
}: DocumentsPageProps) {
  const { t } = useTranslation()
  const { setHeader } = useHeader()
  const [documents, setDocuments] = useState<EDODocument[]>([])
  const [selectedDocument, setSelectedDocument] = useState<EDODocument | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDocument, setLoadingDocument] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const loadDocuments = useCallback(async (filters?: {
    search?: string
    status?: string
    document_type?: string
    priority?: string
    correspondent?: string
  }) => {
    try {
      setLoadingList(true)
      setError(null)
      const docs = await api.getDocuments(filters)
      setDocuments(docs)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('documents.loadError'))
    } finally {
      setLoadingList(false)
    }
  }, [t])

  useEffect(() => {
    setHeader(t('documents.title'), t('documents.subtitle'))
  }, [setHeader, t])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const handleSelectDocument = useCallback(async (doc: EDODocument) => {
    // Set document immediately for instant UI update
    setSelectedDocument(doc)
    setLoadingDocument(true)

    try {
      // Load full document details
      const fullDoc = await api.getDocument(doc.name)
      setSelectedDocument(fullDoc)
    } catch (err) {
      console.error('Failed to load document details:', err)
    } finally {
      setLoadingDocument(false)
    }
  }, [])

  const handleEditDocument = useCallback(() => {
    if (selectedDocument) {
      setEditDialogOpen(true)
    }
  }, [selectedDocument])

  const handleDocumentUpdated = useCallback(async (updatedDoc: EDODocument) => {
    // Reload full document to get all expanded fields
    const fullDoc = await api.getDocument(updatedDoc.name)
    setSelectedDocument(fullDoc)
    // Reload documents list to reflect changes
    await loadDocuments()
  }, [loadDocuments])

  // Auto-select first document when documents are loaded and none is selected
  useEffect(() => {
    if (documents.length > 0 && !selectedDocument && !loadingList) {
      handleSelectDocument(documents[0])
    }
  }, [documents, selectedDocument, loadingList, handleSelectDocument])

  return (
    <motion.div
        key="documents"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 flex overflow-hidden"
      >
        <aside className="w-80 border-r bg-background shrink-0 overflow-hidden">
          <DocumentSidebar
            documents={documents}
            selectedDocument={selectedDocument}
            onSelectDocument={handleSelectDocument}
            loading={loadingList}
            error={error}
            onDocumentsRefresh={() => loadDocuments()}
            onFiltersChange={loadDocuments}
          />
        </aside>

        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDocument?.name || 'empty'}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full"
            >
              <DocumentContent
                document={selectedDocument}
                loading={loadingDocument}
              />
            </motion.div>
          </AnimatePresence>
        </main>

        <aside className="w-96 border-l bg-background shrink-0 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDocument?.name || 'empty'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full"
            >
              <DocumentMetadata
                document={selectedDocument}
                canEdit={canEdit}
                onEdit={handleEditDocument}
              />
            </motion.div>
          </AnimatePresence>
        </aside>

        {/* Edit Document Dialog */}
        <AddDocumentDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          editDocument={selectedDocument}
          onDocumentUpdated={handleDocumentUpdated}
        />
      </motion.div>
  )
}
