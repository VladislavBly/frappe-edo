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
  attachments?: any[]
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

  async createDocument(doc: Partial<EDODocument>): Promise<EDODocument> {
    // Use custom API method instead of direct resource access
    return this.call('edo.edo.doctype.edo_document.edo_document.create_document', doc)
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

  getCSRFToken(): string {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1]
    return token || ''
  }
}

export const api = new FrappeAPI()
