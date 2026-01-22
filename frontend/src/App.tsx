import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { DocumentSidebar } from './components/DocumentSidebar'
import { DocumentContent } from './components/DocumentContent'
import { DocumentMetadata } from './components/DocumentMetadata'
import { api, type EDODocument } from './lib/api'

function App() {
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

      // Auto-select first document if available
      if (docs.length > 0) {
        handleSelectDocument(docs[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить документы')
    } finally {
      setLoadingList(false)
    }
  }

  const handleSelectDocument = async (doc: EDODocument) => {
    setSelectedDocument(doc)
    setLoadingDocument(true)

    try {
      // Fetch full document details
      const fullDoc = await api.getDocument(doc.name)
      setSelectedDocument(fullDoc)
    } catch (err) {
      console.error('Failed to load document details:', err)
      // Keep the basic document info if detail fetch fails
    } finally {
      setLoadingDocument(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />

      {/* Three-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Document list */}
        <aside className="w-80 border-r bg-background shrink-0 overflow-hidden">
          <DocumentSidebar
            documents={documents}
            selectedDocument={selectedDocument}
            onSelectDocument={handleSelectDocument}
            loading={loadingList}
            error={error}
          />
        </aside>

        {/* Center - Document content */}
        <main className="flex-1 bg-gray-50 overflow-hidden">
          <DocumentContent
            document={selectedDocument}
            loading={loadingDocument}
          />
        </main>

        {/* Right sidebar - Metadata */}
        <aside className="w-72 border-l bg-background shrink-0 overflow-hidden">
          <DocumentMetadata document={selectedDocument} />
        </aside>
      </div>
    </div>
  )
}

export default App
