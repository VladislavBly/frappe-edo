import { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { DashboardPage, DocumentsPage } from './pages'
import { api, type EDODocument } from './lib/api'
import { AddDocumentDialog } from './components/AddDocumentDialog'

type Page = 'dashboard' | 'documents'

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const [documents, setDocuments] = useState<EDODocument[]>([])
  const [selectedDocument, setSelectedDocument] = useState<EDODocument | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDocument, setLoadingDocument] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const currentPage: Page = location.pathname.startsWith('/documents') ? 'documents' : 'dashboard'

  // Header title and subtitle based on current page
  const headerTitle = useMemo(() => {
    return currentPage === 'documents' ? t('documents.title') : t('dashboard.title')
  }, [currentPage, t])

  const headerSubtitle = useMemo(() => {
    return currentPage === 'documents' ? t('documents.subtitle') : t('dashboard.subtitle')
  }, [currentPage, t])

  useEffect(() => {
    loadDocuments()
    checkEditPermission()
  }, [])

  const checkEditPermission = async () => {
    try {
      const result = await api.canEditDocument()
      setCanEdit(result)
    } catch (err) {
      console.error('Failed to check edit permission:', err)
    }
  }

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

  const handleSelectDocument = async (doc: EDODocument) => {
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
  }

  const handleNavigate = (page: Page) => {
    if (page === 'dashboard') {
      navigate('/')
      // Clear selected document when navigating away from documents
      setSelectedDocument(null)
    } else {
      navigate('/documents')
      // Reset selected document when navigating to documents
      // This will trigger auto-selection of first document in DocumentsPage
      setSelectedDocument(null)
    }
  }

  const handleEditDocument = () => {
    if (selectedDocument) {
      setEditDialogOpen(true)
    }
  }

  const handleDocumentUpdated = async (updatedDoc: EDODocument) => {
    // Reload full document to get all expanded fields
    const fullDoc = await api.getDocument(updatedDoc.name)
    setSelectedDocument(fullDoc)
    // Refresh documents list
    loadDocuments()
  }

  return (
    <div className="h-screen flex bg-background">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={headerTitle} subtitle={headerSubtitle} />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <DashboardPage
                  documents={documents}
                  onNavigateToDocuments={() => handleNavigate('documents')}
                />
              }
            />
            <Route
              path="/documents/*"
              element={
                <DocumentsPage
                  documents={documents}
                  selectedDocument={selectedDocument}
                  onSelectDocument={handleSelectDocument}
                  loadingList={loadingList}
                  loadingDocument={loadingDocument}
                  error={error}
                  onDocumentsRefresh={() => loadDocuments()}
                  onFiltersChange={loadDocuments}
                  canEdit={canEdit}
                  onEditDocument={handleEditDocument}
                />
              }
            />
          </Routes>
        </AnimatePresence>
      </div>

      {/* Edit Document Dialog */}
      <AddDocumentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editDocument={selectedDocument}
        onDocumentUpdated={handleDocumentUpdated}
      />
    </div>
  )
}

function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  )
}

export default App
