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

export interface Comment {
  name: string
  content: string
  comment_email: string
  comment_by: string
  creation: string
  owner: string
}
