import { useEffect, useState } from 'react'
import { FileText, Calendar } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { api, type EDODocument } from '../lib/api'

export function DocumentList() {
  const [documents, setDocuments] = useState<EDODocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const docs = await api.getDocuments()
      setDocuments(docs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Подписан':
        return 'default'
      case 'На подписании':
        return 'secondary'
      case 'Архив':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">Загрузка документов...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-destructive">Ошибка: {error}</div>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Нет документов</h2>
        <p className="text-muted-foreground">Документы появятся здесь после их создания</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <Card
          key={doc.name}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => window.location.href = `/edo-documents/${doc.name}`}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{doc.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {doc.document_type && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {doc.document_type}
                    </span>
                  )}
                  {doc.document_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(doc.document_date).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </CardDescription>
              </div>
              <Badge variant={getStatusVariant(doc.status)}>{doc.status}</Badge>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
