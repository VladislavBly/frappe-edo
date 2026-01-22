import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard'
import { DocumentSidebar } from './components/DocumentSidebar'
import { DocumentContent } from './components/DocumentContent'
import { DocumentMetadata } from './components/DocumentMetadata'
import { api, type EDODocument } from './lib/api'

type Page = 'dashboard' | 'documents'

function DashboardPage({
  documents,
  onNavigateToDocuments
}: {
  documents: EDODocument[]
  onNavigateToDocuments: () => void
}) {
  const { t } = useTranslation()

  return (
    <>
      <Header title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      <motion.div
        key="dashboard"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1"
      >
        <Dashboard
          documents={documents}
          onNavigateToDocuments={onNavigateToDocuments}
        />
      </motion.div>
    </>
  )
}

function DocumentsPage({
  documents,
  selectedDocument,
  onSelectDocument,
  loadingList,
  loadingDocument,
  error
}: {
  documents: EDODocument[]
  selectedDocument: EDODocument | null
  onSelectDocument: (doc: EDODocument) => void
  loadingList: boolean
  loadingDocument: boolean
  error: string | null
}) {
  const { t } = useTranslation()

  // Auto-select first document when documents are loaded and none is selected
  useEffect(() => {
    if (documents.length > 0 && !selectedDocument && !loadingList) {
      onSelectDocument(documents[0])
    }
  }, [documents, selectedDocument, loadingList, onSelectDocument])

  return (
    <>
      <Header title={t('documents.title')} subtitle={t('documents.subtitle')} />
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

        <aside className="w-72 border-l bg-background shrink-0 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDocument?.name || 'empty'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full"
            >
              <DocumentMetadata document={selectedDocument} />
            </motion.div>
          </AnimatePresence>
        </aside>
      </motion.div>
    </>
  )
}

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const [documents, setDocuments] = useState<EDODocument[]>([])
  const [selectedDocument, setSelectedDocument] = useState<EDODocument | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDocument, setLoadingDocument] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentPage: Page = location.pathname.startsWith('/documents') ? 'documents' : 'dashboard'

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoadingList(true)
      const docs = await api.getDocuments()
      setDocuments(docs)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('documents.loadError'))
    } finally {
      setLoadingList(false)
    }
  }

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

  return (
    <div className="h-screen flex bg-background">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

      <div className="flex-1 flex flex-col overflow-hidden">
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
                />
              }
            />
          </Routes>
        </AnimatePresence>
      </div>
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
