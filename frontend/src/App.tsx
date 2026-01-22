import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard'
import { DocumentSidebar } from './components/DocumentSidebar'
import { DocumentContent } from './components/DocumentContent'
import { DocumentMetadata } from './components/DocumentMetadata'
import { api, type EDODocument } from './lib/api'

type Page = 'dashboard' | 'documents'

function App() {
  const { t } = useTranslation()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [documents, setDocuments] = useState<EDODocument[]>([])
  const [selectedDocument, setSelectedDocument] = useState<EDODocument | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDocument, setLoadingDocument] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load documents on mount
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
    setSelectedDocument(doc)
    setLoadingDocument(true)

    try {
      const fullDoc = await api.getDocument(doc.name)
      setSelectedDocument(fullDoc)
    } catch (err) {
      console.error('Failed to load document details:', err)
    } finally {
      setLoadingDocument(false)
    }
  }

  const handleNavigate = (page: Page) => {
    setCurrentPage(page)
    // Auto-select first document when navigating to documents
    if (page === 'documents' && documents.length > 0 && !selectedDocument) {
      handleSelectDocument(documents[0])
    }
  }

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return { title: t('dashboard.title'), subtitle: t('dashboard.subtitle') }
      case 'documents':
        return { title: t('documents.title'), subtitle: t('documents.subtitle') }
      default:
        return { title: t('app.name'), subtitle: '' }
    }
  }

  const { title, subtitle } = getPageTitle()

  return (
    <div className="h-screen flex bg-background">
      {/* Left Sidebar Navigation */}
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Header title={title} subtitle={subtitle} />

        {/* Content */}
        {currentPage === 'dashboard' ? (
          <Dashboard
            documents={documents}
            onNavigateToDocuments={() => handleNavigate('documents')}
          />
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Document list */}
            <aside className="w-80 border-r bg-background shrink-0 overflow-hidden">
              <DocumentSidebar
                documents={documents}
                selectedDocument={selectedDocument}
                onSelectDocument={handleSelectDocument}
                loading={loadingList}
                error={error}
              />
            </aside>

            {/* Document content */}
            <main className="flex-1 bg-gray-50 overflow-hidden">
              <DocumentContent
                document={selectedDocument}
                loading={loadingDocument}
              />
            </main>

            {/* Document metadata */}
            <aside className="w-72 border-l bg-background shrink-0 overflow-hidden">
              <DocumentMetadata document={selectedDocument} />
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
