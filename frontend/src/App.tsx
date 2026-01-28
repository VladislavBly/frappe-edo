import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { HeaderProvider } from './contexts/HeaderContext'
import { DashboardPage, DocumentsPage } from './pages'
import { api } from './lib/api'

type Page = 'dashboard' | 'documents'

// Map pathname patterns to page types
const getPageFromPath = (pathname: string): Page => {
  const pathToPage: Record<string, Page> = {
    '/documents': 'documents',
    '/': 'dashboard',
  }

  // Check for exact matches first
  if (pathToPage[pathname]) {
    return pathToPage[pathname]
  }

  // Check for pathname starts with patterns
  if (pathname.startsWith('/documents')) {
    return 'documents'
  }

  // Default to dashboard
  return 'dashboard'
}

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [canEdit, setCanEdit] = useState(false)

  const currentPage = getPageFromPath(location.pathname)

  useEffect(() => {
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

  const handleNavigate = (page: Page) => {
    if (page === 'dashboard') {
      navigate('/')
    } else {
      navigate('/documents')
    }
  }

  return (
    <HeaderProvider>
      <div className="h-screen flex bg-background">
        <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <DashboardPage
                  onNavigateToDocuments={() => handleNavigate('documents')}
                />
              }
            />
            <Route
              path="/documents/*"
              element={
                <DocumentsPage canEdit={canEdit} />
              }
            />
          </Routes>
          </AnimatePresence>
        </div>
      </div>
    </HeaderProvider>
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
