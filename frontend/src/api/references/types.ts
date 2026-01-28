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
  position:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'center'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'
    | 'custom'
  x?: number
  y?: number
  scale: number
}

export interface ApplyStampsResult {
  success: boolean
  new_file_url: string
  message: string
}
