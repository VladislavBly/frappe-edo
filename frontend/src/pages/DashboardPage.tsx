import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Dashboard } from '../components/Dashboard'
import { useHeader } from '../contexts/HeaderContext'
import { api, type EDODocument } from '../lib/api'

interface DashboardPageProps {
  onNavigateToDocuments: () => void
}

export function DashboardPage({
  onNavigateToDocuments
}: DashboardPageProps) {
  const { t } = useTranslation()
  const { setHeader } = useHeader()
  const [documents, setDocuments] = useState<EDODocument[]>([])

  useEffect(() => {
    setHeader(t('dashboard.title'), t('dashboard.subtitle'))
  }, [setHeader, t])

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const docs = await api.getDocuments()
        setDocuments(docs)
      } catch (err) {
        console.error('Failed to load documents for dashboard:', err)
      }
    }
    loadDocuments()
  }, [])
  return (
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
  )
}
