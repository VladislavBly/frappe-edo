import { Sidebar, SidebarContent } from './ui/sidebar'
import { DocumentSidebar } from './DocumentSidebar'
import type { EDODocument } from '../api/documents/types'
import type { UseFormReturn } from 'react-hook-form'
import type { DocumentFiltersForm } from '../forms/types'

interface DocumentsAppSidebarProps {
  documents: EDODocument[]
  selectedDocument: EDODocument | null
  onSelectDocument: (doc: EDODocument) => void
  loading: boolean
  error: string | null
  onDocumentsRefresh: () => void
  filtersForm: UseFormReturn<DocumentFiltersForm>
}

export function DocumentsAppSidebar({
  documents,
  selectedDocument,
  onSelectDocument,
  loading,
  error,
  onDocumentsRefresh,
  filtersForm,
}: DocumentsAppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarContent className="p-0">
        <DocumentSidebar
          documents={documents}
          selectedDocument={selectedDocument}
          onSelectDocument={onSelectDocument}
          loading={loading}
          error={error}
          onDocumentsRefresh={onDocumentsRefresh}
          filtersForm={filtersForm}
        />
      </SidebarContent>
    </Sidebar>
  )
}
