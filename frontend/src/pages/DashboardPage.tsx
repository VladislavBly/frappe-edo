import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Dashboard } from '../components/Dashboard'
import { api } from '../lib/api'
import type { EDODocument } from '../api/documents/types'

interface DashboardPageProps {
  onNavigateToDocuments: () => void
}

export function DashboardPage({ onNavigateToDocuments }: DashboardPageProps) {
  const [documents, setDocuments] = useState<EDODocument[]>([])

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
      <Dashboard documents={documents} onNavigateToDocuments={onNavigateToDocuments} />
    </motion.div>
  )
}
