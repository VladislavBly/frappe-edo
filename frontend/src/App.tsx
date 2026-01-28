import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { HeaderProvider, useHeader } from './contexts/HeaderContext'
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
  const { t } = useTranslation()
  const { setHeader } = useHeader()
  const [canEdit, setCanEdit] = useState(false)

  const currentPage = getPageFromPath(location.pathname)

  // Set header based on current route - centralized logic
  useEffect(() => {
    if (currentPage === 'documents') {
      setHeader(t('documents.title'), t('documents.subtitle'))
    } else {
      setHeader(t('dashboard.title'), t('dashboard.subtitle'))
    }
  }, [currentPage, setHeader, t])

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
                  <DashboardPage onNavigateToDocuments={() => handleNavigate('documents')} />
                }
              />
              <Route path="/documents/*" element={<DocumentsPage canEdit={canEdit} />} />
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
