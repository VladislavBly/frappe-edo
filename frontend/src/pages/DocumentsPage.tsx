import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '../components/ui/sidebar'
import { DocumentsAppSidebar } from '../components/DocumentsAppSidebar'
import { DocumentContent } from '../components/DocumentContent'
import { DocumentMetadata } from '../components/DocumentMetadata'
import { AddDocumentDialog } from '../components/AddDocumentDialog'
import { useDocuments, useDocument } from '../api/documents/api'
import { useDocumentFilters } from '../forms'
import type { EDODocument } from '../api/documents/types'

interface DocumentsPageProps {
  canEdit?: boolean
}

export function DocumentsPage({ canEdit = false }: DocumentsPageProps) {
  const [selectedDocumentName, setSelectedDocumentName] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [filters, setFilters] = useState<{
    search?: string
    status?: string
    document_type?: string
    priority?: string
    correspondent?: string
  }>()

  // Use document filters hook - manages form state and debouncing
  // Memoize the callback to prevent form recreation
  const handleFiltersChange = useCallback((filters: {
    search?: string
    status?: string
    document_type?: string
    priority?: string
    correspondent?: string
  }) => {
    setFilters(filters)
  }, [])

  const { form: filtersForm } = useDocumentFilters({
    onFiltersChange: handleFiltersChange,
  })

  // Memoize filters object to prevent unnecessary re-renders
  const memoizedFilters = useMemo(
    () => ({
      search: filters?.search?.trim() || undefined,
      status: filters?.status || undefined,
      document_type: filters?.document_type || undefined,
      priority: filters?.priority || undefined,
      correspondent: filters?.correspondent || undefined,
    }),
    [filters]
  )

  // Fetch documents list - automatically refetches when filters change
  const {
    data: documents = [],
    isLoading: loadingList,
    error: documentsError,
    refetch: refetchDocuments,
  } = useDocuments(memoizedFilters)

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

  const handleDocumentsRefresh = useCallback(() => {
    refetchDocuments()
  }, [refetchDocuments])

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
    <SidebarProvider>
      <DocumentsAppSidebar
        documents={documents}
        selectedDocument={selectedDocument || null}
        onSelectDocument={handleSelectDocument}
        loading={loadingList}
        error={error}
        onDocumentsRefresh={handleDocumentsRefresh}
        filtersForm={filtersForm}
      />
      <SidebarInset>
        <motion.div
          key="documents"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-1 flex-col min-h-0 overflow-hidden"
        >
          <header className="shrink-0 flex items-center gap-2 border-b bg-background px-4 py-2">
            <SidebarTrigger />
          </header>
          <section className="flex flex-1 min-h-0 overflow-hidden">
          <main className="flex-1 overflow-hidden relative min-w-0">
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
          </section>
        </motion.div>
      </SidebarInset>

      {/* Edit Document Dialog */}
      <AddDocumentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editDocument={selectedDocument || null}
        onDocumentUpdated={handleDocumentUpdated}
      />
    </SidebarProvider>
  )
}
