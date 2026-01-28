import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DocumentSidebar } from '../components/DocumentSidebar'
import { DocumentContent } from '../components/DocumentContent'
import { DocumentMetadata } from '../components/DocumentMetadata'
import { AddDocumentDialog } from '../components/AddDocumentDialog'
import { useDocuments, useDocument } from '../api/documents/api'
import type { EDODocument } from '../api/documents/types'

interface DocumentsPageProps {
  canEdit?: boolean
}

export function DocumentsPage({ canEdit = false }: DocumentsPageProps) {
  const [selectedDocumentName, setSelectedDocumentName] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    search?: string
    status?: string
    document_type?: string
    priority?: string
    correspondent?: string
  }>()
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Fetch documents list
  const {
    data: documents = [],
    isLoading: loadingList,
    error: documentsError,
    refetch: refetchDocuments,
  } = useDocuments(filters)

  // Fetch selected document
  const { data: selectedDocument, isLoading: loadingDocument } = useDocument(
    selectedDocumentName,
    !!selectedDocumentName
  )

  const handleSelectDocument = useCallback((doc: EDODocument) => {
    setSelectedDocumentName(doc.name)
  }, [])

  const handleEditDocument = useCallback(() => {
    if (selectedDocument) {
      setEditDialogOpen(true)
    }
  }, [selectedDocument])

  const handleDocumentUpdated = useCallback(
    async (updatedDoc: EDODocument) => {
      // The document is already updated via API in AddDocumentDialog
      // Just refetch to get full document with all expanded fields
      setSelectedDocumentName(updatedDoc.name)
      // Refetch documents list to reflect changes
      refetchDocuments()
    },
    [refetchDocuments]
  )

  const handleFiltersChange = useCallback(
    (newFilters?: {
      search?: string
      status?: string
      document_type?: string
      priority?: string
      correspondent?: string
    }) => {
      setFilters(newFilters)
    },
    []
  )

  // Auto-select first document when documents are loaded and none is selected
  useEffect(() => {
    if (documents.length > 0 && !selectedDocumentName && !loadingList) {
      handleSelectDocument(documents[0])
    }
  }, [documents, selectedDocumentName, loadingList, handleSelectDocument])

  const error =
    documentsError instanceof Error
      ? documentsError.message
      : documentsError
        ? String(documentsError)
        : null

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
          selectedDocument={selectedDocument || null}
          onSelectDocument={handleSelectDocument}
          loading={loadingList}
          error={error}
          onDocumentsRefresh={() => refetchDocuments()}
          onFiltersChange={handleFiltersChange}
        />
      </aside>

      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDocument?.name || 'empty'}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-full"
          >
            <DocumentContent document={selectedDocument || null} loading={loadingDocument} />
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
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-full"
          >
            <DocumentMetadata
              document={selectedDocument || null}
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
        editDocument={selectedDocument || null}
        onDocumentUpdated={handleDocumentUpdated}
      />
    </motion.div>
  )
}
