export interface EDODocument {
  name: string
  title: string
  document_type?: string
  status: string
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
}

export interface Comment {
  name: string
  content: string
  comment_email: string
  comment_by: string
  creation: string
  owner: string
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

  async getDocuments(): Promise<EDODocument[]> {
    return this.call('edo.edo.doctype.edo_document.edo_document.get_portal_documents')
  }

  async getDocument(name: string): Promise<EDODocument> {
    const response = await fetch(`${this.baseURL}/api/resource/EDO Document/${name}`, {
      headers: {
        'X-Frappe-CSRF-Token': this.getCSRFToken(),
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
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
    return {
      name: userData.data.name,
      full_name: userData.data.full_name || userData.data.name,
      email: userData.data.email,
      user_image: userData.data.user_image,
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

  private getCSRFToken(): string {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1]
    return token || ''
  }
}

export const api = new FrappeAPI()
