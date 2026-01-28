import { motion } from 'framer-motion'
import { Dashboard } from '../components/Dashboard'
import type { EDODocument } from '../lib/api'

interface DashboardPageProps {
  documents: EDODocument[]
  onNavigateToDocuments: () => void
}

export function DashboardPage({
  documents,
  onNavigateToDocuments
}: DashboardPageProps) {
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
