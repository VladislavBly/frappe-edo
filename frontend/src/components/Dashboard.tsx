import { FileText, Clock, CheckCircle2, Archive, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import type { EDODocument } from '../lib/api'

interface DashboardProps {
  documents: EDODocument[]
  onNavigateToDocuments: () => void
}

export function Dashboard({ documents, onNavigateToDocuments }: DashboardProps) {
  const { t } = useTranslation()
  
  // Calculate statistics
  const totalDocs = documents.length
  const pendingDocs = documents.filter((d) => 
    d.status === t('documents.status.pending') || d.status === 'На подписании'
  ).length
  const signedDocs = documents.filter((d) => 
    d.status === t('documents.status.signed') || d.status === 'Подписан'
  ).length
  const archivedDocs = documents.filter((d) => 
    d.status === t('documents.status.archived') || d.status === 'Архив'
  ).length

  const stats = [
    {
      title: t('dashboard.stats.total'),
      value: totalDocs,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('dashboard.stats.pending'),
      value: pendingDocs,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: t('dashboard.stats.signed'),
      value: signedDocs,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: t('dashboard.stats.archived'),
      value: archivedDocs,
      icon: Archive,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ]

  // Recent documents (last 5)
  const recentDocs = [...documents]
    .sort((a, b) => {
      const dateA = a.creation ? new Date(a.creation).getTime() : 0
      const dateB = b.creation ? new Date(b.creation).getTime() : 0
      return dateB - dateA
    })
    .slice(0, 5)

  // Pending documents
  const pendingDocsList = documents
    .filter((d) => d.status === t('documents.status.pending') || d.status === 'На подписании')
    .slice(0, 5)

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending signatures */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                {t('dashboard.pendingSignatures')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingDocsList.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t('dashboard.noPending')}
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingDocsList.map((doc) => (
                    <div
                      key={doc.name}
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
                      onClick={onNavigateToDocuments}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.document_type}
                        </p>
                      </div>
                      <div className="text-xs text-orange-600 shrink-0 ml-2">
                        {t('dashboard.waiting')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent documents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                {t('dashboard.recentDocuments')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentDocs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t('dashboard.noDocuments')}
                </p>
              ) : (
                <div className="space-y-3">
                  {recentDocs.map((doc) => (
                    <div
                      key={doc.name}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      onClick={onNavigateToDocuments}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.creation &&
                            new Date(doc.creation).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <div
                        className={`text-xs shrink-0 ml-2 px-2 py-1 rounded ${
                          doc.status === t('documents.status.signed') || doc.status === 'Подписан'
                            ? 'bg-green-100 text-green-700'
                            : doc.status === t('documents.status.pending') || doc.status === 'На подписании'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {doc.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
