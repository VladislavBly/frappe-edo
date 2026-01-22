import { useEffect, useState } from 'react'
import { ArrowLeft, Calendar, User, FileText, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { api, type EDODocument } from '../lib/api'

interface DocumentDetailProps {
  documentName: string
}

export function DocumentDetail({ documentName }: DocumentDetailProps) {
  const [document, setDocument] = useState<EDODocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDocument()
  }, [documentName])

  const loadDocument = async () => {
    try {
      setLoading(true)
      const doc = await api.getDocument(documentName)
      setDocument(doc)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document')
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
        <div className="text-lg text-muted-foreground">Загрузка документа...</div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-lg text-destructive mb-4">
          {error || 'Документ не найден'}
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/edo_documents'}>
          <ArrowLeft className="w-4 h-4" />
          Вернуться к списку
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => window.location.href = '/edo_documents'}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к списку
        </Button>
        <div className="flex items-start justify-between">
          <h1 className="text-3xl font-bold">{document.title}</h1>
          <Badge variant={getStatusVariant(document.status)} className="text-sm">
            {document.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {document.document_type && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Тип документа
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{document.document_type}</p>
              </CardContent>
            </Card>
          )}

          {document.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Описание</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: document.description }}
                />
              </CardContent>
            </Card>
          )}

          {document.author && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Автор
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{document.author}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">ID документа</p>
                <p className="font-mono text-sm">{document.name}</p>
              </div>

              {document.document_date && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Дата документа
                  </p>
                  <p>{new Date(document.document_date).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
              )}

              {document.registration_date && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Дата регистрации
                  </p>
                  <p>{new Date(document.registration_date).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
              )}

              {document.creation && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Создан
                  </p>
                  <p className="text-sm">{new Date(document.creation).toLocaleString('ru-RU')}</p>
                </div>
              )}

              {document.modified && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Изменен
                  </p>
                  <p className="text-sm">{new Date(document.modified).toLocaleString('ru-RU')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
