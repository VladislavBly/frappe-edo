export interface EDOCoExecutor {
  name?: string
  user: string
  user_full_name?: string
  user_image?: string
}

export interface EDOAttachment {
  name?: string
  attachment: string
  file_name: string
  file_size?: number
}

export interface EDODocumentSignature {
  name?: string
  user: string
  user_full_name?: string
  user_image?: string
  signed_at?: string
  comment?: string
}

export interface EDODocument {
  name: string
  incoming_number?: string
  incoming_date?: string
  outgoing_number?: string
  outgoing_date?: string
  title?: string
  correspondent?: string
  correspondent_name?: string
  document_type?: string
  document_type_name?: string
  priority?: string
  priority_name?: string
  status: string
  status_name?: string
  brief_content?: string
  classification?: string
  classification_name?: string
  delivery_method?: string
  delivery_method_name?: string
  main_document?: string
  attachments?: EDOAttachment[]
  executor?: string
  executor_full_name?: string
  executor_image?: string
  co_executors?: EDOCoExecutor[]
  // Director approval fields
  director_approved?: boolean
  director_rejected?: boolean
  director_user?: string
  director_full_name?: string
  director_image?: string
  director_decision_date?: string
  director_comment?: string
  // Reception fields
  reception_office?: string
  resolution?: string
  resolution_name?: string
  resolution_text?: string
  resolution_text_from_link?: string
  reception_user?: string
  reception_decision_date?: string
  // Signatures
  signatures?: EDODocumentSignature[]
  // Legacy fields for compatibility
  document_date?: string
  registration_date?: string
  description?: string
  author?: string
  creation?: string
  modified?: string
}

export interface User {
  name: string
  full_name: string
  email: string
  user_image?: string
  roles?: string[]
}

export interface Comment {
  name: string
  content: string
  comment_email: string
  comment_by: string
  creation: string
  owner: string
}

export interface EDOCorrespondent {
  name: string
  correspondent_name: string
}

export interface EDODocumentType {
  name: string
  document_type_name: string
}

export interface EDOPriority {
  name: string
  priority_name: string
  weight: number
}

export interface EDOStatus {
  name: string
  status_name: string
  color?: string
}

export interface EDOClassification {
  name: string
  classification_name: string
}

export interface EDODeliveryMethod {
  name: string
  delivery_method_name: string
}

export interface EDOResolution {
  name: string
  resolution_name: string
  resolution_text?: string
  is_active: boolean
}

export interface EDOReceptionOffice {
  name: string
  reception_office_name: string
}

// Stamp types
export interface EDOStamp {
  name: string
  title: string
  stamp_image: string
}

export interface PdfPageInfo {
  width: number
  height: number
}

export interface PdfInfo {
  page_count: number
  pages: PdfPageInfo[]
}

export interface StampPlacement {
  stamp_name: string
  page_number: number // 0-indexed
  position: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'custom'
  x?: number
  y?: number
  scale: number
}

export interface ApplyStampsResult {
  success: boolean
  new_file_url: string
  message: string
}

class FrappeAPI {
  private baseURL: string

  constructor() {
    this.baseURL = window.location.origin
  }

  async call(method: string, args?: any) {
    const response = await fetch(`${this.baseURL}/api/method/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Frappe-CSRF-Token': this.getCSRFToken(),
      },
      body: JSON.stringify(args || {}),
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.message
  }

  async getDocuments(filters?: {
    search?: string
    status?: string
    document_type?: string
    priority?: string
    correspondent?: string
  }): Promise<EDODocument[]> {
    return this.call('edo.edo.doctype.edo_document.edo_document.get_portal_documents', filters || {})
  }

  async getDocument(name: string): Promise<EDODocument> {
    // Use API method instead of direct resource access to bypass permission checks
    const response = await fetch(`${this.baseURL}/api/method/edo.edo.doctype.edo_document.edo_document.get_document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Frappe-CSRF-Token': this.getCSRFToken(),
      },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`)
    }

    const data = await response.json()
    return data.message
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.baseURL}/api/method/frappe.auth.get_logged_user`, {
      headers: {
        'X-Frappe-CSRF-Token': this.getCSRFToken(),
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.statusText}`)
    }

    const data = await response.json()
    const userId = data.message

    // Get full user info
    const userResponse = await fetch(`${this.baseURL}/api/resource/User/${userId}`, {
      headers: {
        'X-Frappe-CSRF-Token': this.getCSRFToken(),
      },
    })

    if (!userResponse.ok) {
      return { name: userId, full_name: userId, email: userId }
    }

    const userData = await userResponse.json()
    
    // Get user roles using our custom API method
    let roles: string[] = []
    try {
      roles = await this.call('edo.edo.doctype.edo_document.edo_document.get_user_roles')
    } catch (error) {
      console.warn('Failed to get user roles:', error)
    }

    return {
      name: userData.data.name,
      full_name: userData.data.full_name || userData.data.name,
      email: userData.data.email,
      user_image: userData.data.user_image,
      roles,
    }
  }

  async logout(): Promise<void> {
    await fetch(`${this.baseURL}/api/method/logout`, {
      method: 'POST',
      headers: {
        'X-Frappe-CSRF-Token': this.getCSRFToken(),
      },
    })
    window.location.href = '/login'
  }

  async getComments(doctype: string, docname: string): Promise<Comment[]> {
    return this.call('edo.edo.doctype.edo_document.edo_document.get_comments', {
      doctype,
      docname,
    })
  }

  async addComment(doctype: string, docname: string, content: string): Promise<Comment> {
    return this.call('edo.edo.doctype.edo_document.edo_document.add_comment', {
      doctype,
      docname,
      content,
    })
  }

  async deleteComment(commentName: string): Promise<void> {
    return this.call('edo.edo.doctype.edo_document.edo_document.delete_comment', {
      comment_name: commentName,
    })
  }

  async getCorrespondents(): Promise<EDOCorrespondent[]> {
    const response = await fetch(`${this.baseURL}/api/resource/EDO Correspondent?fields=["name","correspondent_name"]&limit_page_length=999`, {
      headers: {
        'X-Frappe-CSRF-Token': this.getCSRFToken(),
      },
    })
    if (!response.ok) throw new Error('Failed to fetch correspondents')
    const data = await response.json()
    return data.data
  }

  async getDocumentTypes(): Promise<EDODocumentType[]> {
    const response = await fetch(`${this.baseURL}/api/resource/EDO Document Type?fields=["name","document_type_name"]&limit_page_length=999`, {
      headers: {
        'X-Frappe-CSRF-Token': this.getCSRFToken(),
      },
    })
    if (!response.ok) throw new Error('Failed to fetch document types')
    const data = await response.json()
    return data.data
  }

  async getPriorities(): Promise<EDOPriority[]> {
    const response = await fetch(`${this.baseURL}/api/resource/EDO Priority?fields=["name","priority_name","weight"]&limit_page_length=999&order_by=weight desc`, {
      headers: {
        'X-Frappe-CSRF-Token': this.getCSRFToken(),
      },
    })
    if (!response.ok) throw new Error('Failed to fetch priorities')
    const data = await response.json()
    return data.data
  }

  async getStatuses(): Promise<EDOStatus[]> {
    const response = await fetch(`${this.baseURL}/api/resource/EDO Status?fields=["name","status_name","color"]&limit_page_length=999`, {
      headers: {
        'X-Frappe-CSRF-Token': this.getCSRFToken(),
      },
    })
    if (!response.ok) throw new Error('Failed to fetch statuses')
    const data = await response.json()
    return data.data
  }

  async getClassifications(): Promise<EDOClassification[]> {
    const response = await fetch(`${this.baseURL}/api/resource/EDO Classification?fields=["name","classification_name"]&limit_page_length=999`, {
      headers: {
        'X-Frappe-CSRF-Token': this.getCSRFToken(),
      },
    })
    if (!response.ok) throw new Error('Failed to fetch classifications')
    const data = await response.json()
    return data.data
  }

  async getDeliveryMethods(): Promise<EDODeliveryMethod[]> {
    const response = await fetch(`${this.baseURL}/api/resource/EDO Delivery Method?fields=["name","delivery_method_name"]&limit_page_length=999`, {
      headers: {
        'X-Frappe-CSRF-Token': this.getCSRFToken(),
      },
    })
    if (!response.ok) throw new Error('Failed to fetch delivery methods')
    const data = await response.json()
    return data.data
  }

  async getUsers(): Promise<User[]> {
    return this.call('edo.edo.doctype.edo_document.edo_document.get_users_list')
  }

  async getReceptionOffices(): Promise<EDOReceptionOffice[]> {
    const response = await fetch(`${this.baseURL}/api/resource/EDO Reception Office?fields=["name","reception_office_name"]&limit_page_length=999`, {
      headers: {
        'X-Frappe-CSRF-Token': this.getCSRFToken(),
      },
    })
    if (!response.ok) throw new Error('Failed to fetch reception offices')
    const data = await response.json()
    return data.data
  }

  async createDocument(doc: Partial<EDODocument>): Promise<EDODocument> {
    // Use custom API method instead of direct resource access
    return this.call('edo.edo.doctype.edo_document.edo_document.create_document', doc)
  }

  async updateDocument(name: string, doc: Partial<EDODocument>): Promise<EDODocument> {
    return this.call('edo.edo.doctype.edo_document.edo_document.update_document', { name, ...doc })
  }

  async canEditDocument(): Promise<boolean> {
    return this.call('edo.edo.doctype.edo_document.edo_document.can_edit_document')
  }

  async directorApproveDocument(name: string, comment?: string): Promise<EDODocument> {
    return this.call('edo.edo.doctype.edo_document.edo_document.director_approve_document', {
      name,
      comment,
    })
  }

  async directorRejectDocument(name: string, comment?: string): Promise<EDODocument> {
    return this.call('edo.edo.doctype.edo_document.edo_document.director_reject_document', {
      name,
      comment,
    })
  }

  async executorSignDocument(name: string, comment?: string): Promise<EDODocument> {
    return this.call('edo.edo.doctype.edo_document.edo_document.executor_sign_document', {
      name,
      comment,
    })
  }

  async canDirectorApprove(): Promise<boolean> {
    return this.call('edo.edo.doctype.edo_document.edo_document.can_director_approve')
  }

  async canExecutorSign(name: string): Promise<boolean> {
    return this.call('edo.edo.doctype.edo_document.edo_document.can_executor_sign', { name })
  }

  async uploadFile(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('is_private', '0')

    const response = await fetch(`${this.baseURL}/api/method/upload_file`, {
      method: 'POST',
      headers: {
        'X-Frappe-CSRF-Token': this.getCSRFToken(),
      },
      body: formData,
    })

    if (!response.ok) throw new Error('Failed to upload file')
    const data = await response.json()
    return data.message.file_url
  }

  // Stamp methods
  async getStamps(): Promise<EDOStamp[]> {
    return this.call('edo.edo.doctype.edo_document.edo_document.get_stamps')
  }

  async getStampPreview(stampName: string, documentName?: string): Promise<string> {
    return this.call('edo.edo.doctype.edo_stamp.edo_stamp.get_stamp_preview', {
      stamp_name: stampName,
      document_name: documentName,
    })
  }

  async getPdfInfo(documentName: string): Promise<PdfInfo> {
    return this.call('edo.edo.doctype.edo_document.edo_document.get_pdf_info', {
      document_name: documentName,
    })
  }

  async applyStamps(documentName: string, stamps: StampPlacement[]): Promise<ApplyStampsResult> {
    return this.call('edo.edo.doctype.edo_document.edo_document.apply_stamps_to_pdf', {
      document_name: documentName,
      stamps: JSON.stringify(stamps),
    })
  }

  // Reception methods
  async canReceptionSubmit(): Promise<boolean> {
    return this.call('edo.edo.doctype.edo_document.edo_document.can_reception_submit')
  }

  async receptionSubmitToDirector(
    documentName: string,
    resolution?: string,
    resolutionText?: string,
    executor?: string,
    coExecutors?: string[]
  ): Promise<EDODocument> {
    return this.call('edo.edo.doctype.edo_document.edo_document.reception_submit_to_director', {
      name: documentName,
      resolution,
      resolution_text: resolutionText,
      executor,
      co_executors: coExecutors ? JSON.stringify(coExecutors) : undefined,
    })
  }

  async getResolutions(): Promise<EDOResolution[]> {
    const response = await fetch(`${this.baseURL}/api/resource/EDO Resolution?fields=["name","resolution_name","resolution_text","is_active"]&filters=[["is_active","=",1]]&limit_page_length=999`, {
      headers: {
        'X-Frappe-CSRF-Token': this.getCSRFToken(),
      },
    })
    if (!response.ok) throw new Error('Failed to fetch resolutions')
    const data = await response.json()
    return data.data
  }

  getCSRFToken(): string {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1]
    return token || ''
  }
}

export const api = new FrappeAPI()
