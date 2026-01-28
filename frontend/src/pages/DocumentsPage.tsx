import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DocumentSidebar } from '../components/DocumentSidebar'
import { DocumentContent } from '../components/DocumentContent'
import { DocumentMetadata } from '../components/DocumentMetadata'
import type { EDODocument } from '../lib/api'

interface DocumentsPageProps {
  documents: EDODocument[]
  selectedDocument: EDODocument | null
  onSelectDocument: (doc: EDODocument) => void
  loadingList: boolean
  loadingDocument: boolean
  error: string | null
  onDocumentsRefresh?: () => void
  onFiltersChange?: (filters: {
    search?: string
    status?: string
    document_type?: string
    priority?: string
    correspondent?: string
  }) => void
  canEdit?: boolean
  onEditDocument?: () => void
}

export function DocumentsPage({
  documents,
  selectedDocument,
  onSelectDocument,
  loadingList,
  loadingDocument,
  error,
  onDocumentsRefresh,
  onFiltersChange,
  canEdit,
  onEditDocument
}: DocumentsPageProps) {
  // Auto-select first document when documents are loaded and none is selected
  useEffect(() => {
    if (documents.length > 0 && !selectedDocument && !loadingList) {
      onSelectDocument(documents[0])
    }
  }, [documents, selectedDocument, loadingList, onSelectDocument])

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
            onSelectDocument={onSelectDocument}
            loading={loadingList}
            error={error}
            onDocumentsRefresh={onDocumentsRefresh}
            onFiltersChange={onFiltersChange}
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
                onEdit={onEditDocument}
              />
            </motion.div>
          </AnimatePresence>
        </aside>
      </motion.div>
  )
}
