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
