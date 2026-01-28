import { useState, useEffect, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { api } from '../lib/api'
import { useStamps, usePdfInfo, useApplyStamps } from '../api/stamps/api'
import type { StampPlacement } from '../api/stamps/types'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { X, Plus, Trash2, Move, ChevronLeft, ChevronRight } from 'lucide-react'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PdfStampEditorProps {
  documentName: string
  pdfUrl: string
  onClose: () => void
  onStampApplied: () => void
}

interface PlacedStamp extends StampPlacement {
  id: string
  stamp_title: string
  stamp_image: string
}

const POSITIONS = [
  { value: 'top-left', label: 'Верх-лево' },
  { value: 'top-center', label: 'Верх-центр' },
  { value: 'top-right', label: 'Верх-право' },
  { value: 'center', label: 'Центр' },
  { value: 'bottom-left', label: 'Низ-лево' },
  { value: 'bottom-center', label: 'Низ-центр' },
  { value: 'bottom-right', label: 'Низ-право' },
  { value: 'custom', label: 'Произвольно' },
] as const

export function PdfStampEditor({
  documentName,
  pdfUrl,
  onClose,
  onStampApplied,
}: PdfStampEditorProps) {
  const { data: stampsData = [], isLoading: stampsLoading } = useStamps()
  const {
    data: pdfInfoData,
    isLoading: pdfInfoLoading,
    error: pdfInfoError,
  } = usePdfInfo(documentName)
  const applyStampsMutation = useApplyStamps()

  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStamp, setSelectedStamp] = useState<string>('')
  const [selectedPosition, setSelectedPosition] = useState<string>('bottom-right')
  const scale = 0.15 // Масштаб по умолчанию - 15% от оригинального размера
  const [placedStamps, setPlacedStamps] = useState<PlacedStamp[]>([])
  const [customPosition, setCustomPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null)
  const [stampImageSizes, setStampImageSizes] = useState<
    Record<string, { width: number; height: number }>
  >({})
  const [stampPreviews, setStampPreviews] = useState<Record<string, string>>({})

  const loading = stampsLoading || pdfInfoLoading
  const stamps = stampsData

  // Показываем ошибку если не удалось загрузить PDF info
  useEffect(() => {
    if (pdfInfoError) {
      console.error('Failed to load PDF info:', pdfInfoError)
      // Не блокируем работу редактора, просто логируем ошибку
    }
  }, [pdfInfoError])
  const pdfInfo = pdfInfoData || null

  const pdfContainerRef = useRef<HTMLDivElement>(null)
  const stampPreviewRef = useRef<HTMLDivElement>(null)
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 })

  // Функция для получения полного URL изображения
  const getFullImageUrl = (imageUrl: string): string => {
    if (!imageUrl) {
      console.warn('getFullImageUrl: empty imageUrl')
      return ''
    }

    // Если уже полный URL, используем как есть
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('getFullImageUrl: already full URL:', imageUrl)
      return imageUrl
    }

    // Если URL уже содержит origin, используем как есть
    if (imageUrl.includes(window.location.origin)) {
      console.log('getFullImageUrl: URL contains origin:', imageUrl)
      return imageUrl
    }

    // Для API endpoints (начинаются с /api/), используем как есть с origin
    if (imageUrl.startsWith('/api/')) {
      const fullUrl = `${window.location.origin}${imageUrl}`
      console.log('getFullImageUrl: API endpoint:', fullUrl)
      return fullUrl
    }

    // Для обычных файлов, добавляем origin
    const fullUrl = `${window.location.origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
    console.log('getFullImageUrl: constructed URL:', fullUrl, 'from:', imageUrl)
    return fullUrl
  }

  // Load stamp previews and image dimensions
  useEffect(() => {
    if (!stamps.length || !documentName) return

    async function loadPreviews() {
      const sizes: Record<string, { width: number; height: number }> = {}
      const previews: Record<string, string> = {}

      await Promise.all(
        stamps.map(async stamp => {
          if (stamp.stamp_image) {
            // Загружаем превью с заполненными полями
            try {
              const previewUrl = await api.getStampPreview(stamp.name, documentName)
              previews[stamp.name] = previewUrl
            } catch (error) {
              console.warn(`Failed to load preview for stamp ${stamp.name}:`, error)
              // Используем оригинальное изображение как fallback
              previews[stamp.name] = getFullImageUrl(stamp.stamp_image)
            }

            // Загружаем размеры изображения (используем превью если есть)
            const imageUrl = previews[stamp.name] || getFullImageUrl(stamp.stamp_image)
            try {
              const img = new Image()
              await new Promise((resolve, reject) => {
                img.onload = () => {
                  sizes[stamp.stamp_image] = { width: img.width, height: img.height }
                  resolve(null)
                }
                img.onerror = reject
                img.src = imageUrl
              })
            } catch (error) {
              console.warn(`Failed to load image dimensions for stamp ${stamp.name}:`, error)
              sizes[stamp.stamp_image] = { width: 150, height: 50 } // Default fallback
            }
          }
        })
      )
      setStampImageSizes(sizes)
      setStampPreviews(previews)
    }

    loadPreviews()
  }, [stamps, documentName])

  // Set first stamp as selected when stamps are loaded
  useEffect(() => {
    if (stamps.length > 0 && !selectedStamp) {
      setSelectedStamp(stamps[0].name)
    }
  }, [stamps, selectedStamp])

  // Handle PDF page load
  const onPageLoadSuccess = useCallback(({ width, height }: { width: number; height: number }) => {
    setPdfDimensions({ width, height })
  }, [])

  // Add stamp to list
  const addStamp = () => {
    if (!selectedStamp) return

    const stamp = stamps.find(s => s.name === selectedStamp)
    if (!stamp) return

    // Для произвольной позиции убеждаемся, что координаты установлены
    let finalX = undefined
    let finalY = undefined

    if (selectedPosition === 'custom') {
      if (previewPosition && pdfInfo?.pages[currentPage - 1]) {
        const pageInfo = pdfInfo.pages[currentPage - 1]
        const scaleX = pdfDimensions.width / pageInfo.width
        const scaleY = pdfDimensions.height / pageInfo.height

        // Конвертируем экранные координаты в PDF координаты
        // previewPosition - это центр штампа на экране
        finalX = previewPosition.x / scaleX
        // PDF координаты идут снизу вверх, экранные сверху вниз
        finalY = (pdfDimensions.height - previewPosition.y) / scaleY
      } else if (customPosition.x && customPosition.y) {
        // Используем сохраненные координаты
        finalX = customPosition.x
        finalY = customPosition.y
      }
    }

    const newStamp: PlacedStamp = {
      id: `stamp-${Date.now()}`,
      stamp_name: selectedStamp,
      stamp_title: stamp.title,
      stamp_image: stamp.stamp_image,
      page_number: currentPage - 1, // 0-indexed for API
      position: selectedPosition as StampPlacement['position'],
      scale,
      x: finalX,
      y: finalY,
    }

    setPlacedStamps([...placedStamps, newStamp])

    // Сбрасываем превью после добавления штампа
    // Если остаемся в произвольном режиме, обновляем позицию для следующего штампа
    if (selectedPosition === 'custom' && pdfDimensions.width && pdfDimensions.height) {
      const pageInfo = pdfInfo?.pages[currentPage - 1]
      if (pageInfo) {
        // Устанавливаем новую позицию по умолчанию (немного смещенную)
        const newX = pdfDimensions.width / 2
        const newY = pdfDimensions.height / 2
        setPreviewPosition({ x: newX, y: newY })
        setCustomPosition({ x: pageInfo.width / 2, y: pageInfo.height / 2 })
      }
    } else {
      // Для не-произвольных позиций сбрасываем превью
      setPreviewPosition(null)
    }
  }

  // Remove stamp from list
  const removeStamp = (id: string) => {
    setPlacedStamps(placedStamps.filter(s => s.id !== id))
  }

  // Apply all stamps
  const applyStamps = async () => {
    if (placedStamps.length === 0) return

    try {
      const stampsData: StampPlacement[] = placedStamps.map(s => ({
        stamp_name: s.stamp_name,
        page_number: s.page_number,
        position: s.position,
        x: s.x,
        y: s.y,
        scale: s.scale,
      }))

      console.log('Applying stamps:', stampsData)
      const result = await applyStampsMutation.mutateAsync({
        documentName,
        stamps: stampsData,
      })
      console.log('Apply stamps result:', result)

      if (result && result.success) {
        // Успешно применено
        onStampApplied()
      } else {
        // Ошибка, но без исключения
        const errorMsg = result?.message || 'Не удалось применить штампы'
        alert(errorMsg)
        console.error('Failed to apply stamps:', result)
      }
    } catch (error: any) {
      // Ошибка при вызове API
      const errorMsg = error?.message || 'Произошла ошибка при применении штампов'
      alert(errorMsg)
      console.error('Failed to apply stamps:', error)
    }
  }

  // Handle click for custom positioning
  const handleClick = (e: React.MouseEvent) => {
    if (selectedPosition !== 'custom' || !pdfContainerRef.current || !selectedStamp) return
    // Не обрабатываем клик, если кликнули на превью штампа
    if ((e.target as HTMLElement).closest('.stamp-preview-draggable')) return

    const rect = pdfContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Клик - это центр будущего штампа
    setPreviewPosition({ x, y })

    // Convert to PDF coordinates
    const pageInfo = pdfInfo?.pages[currentPage - 1]
    if (pageInfo) {
      const scaleX = pdfDimensions.width / pageInfo.width
      const scaleY = pdfDimensions.height / pageInfo.height
      // x и y - это центр штампа на экране
      const pdfX = x / scaleX
      // PDF y идет снизу вверх, экранный y сверху вниз
      const pdfY = (pdfDimensions.height - y) / scaleY
      setCustomPosition({ x: pdfX, y: pdfY })
    } else {
      // Fallback если страница еще не загружена
      const pdfX = (x / rect.width) * 595
      const pdfY = ((rect.height - y) / rect.height) * 842
      setCustomPosition({ x: pdfX, y: pdfY })
    }
  }

  // Handle drag start for stamp preview
  const handleDragStart = (e: React.MouseEvent) => {
    if (selectedPosition !== 'custom' || !selectedStamp || !stampPreviewRef.current) return

    e.preventDefault()
    setIsDragging(true)

    const rect = stampPreviewRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    })
  }

  // Update preview position when custom position changes or position type changes
  useEffect(() => {
    if (
      selectedPosition === 'custom' &&
      selectedStamp &&
      pdfContainerRef.current &&
      pdfDimensions.width &&
      pdfDimensions.height
    ) {
      const pageInfo = pdfInfo?.pages[currentPage - 1]
      if (pageInfo && customPosition.x && customPosition.y) {
        const scaleX = pdfDimensions.width / pageInfo.width
        const scaleY = pdfDimensions.height / pageInfo.height
        // customPosition - это PDF координаты (центр штампа)
        // Конвертируем в экранные координаты (центр штампа)
        const x = customPosition.x * scaleX
        const y = pdfDimensions.height - customPosition.y * scaleY
        setPreviewPosition({ x, y })
      } else if (!previewPosition) {
        // Если страница еще не загружена, устанавливаем позицию по умолчанию
        setPreviewPosition({ x: pdfDimensions.width / 2, y: pdfDimensions.height / 2 })
      }
    } else if (selectedPosition !== 'custom') {
      setPreviewPosition(null)
    }
  }, [selectedPosition, selectedStamp, customPosition, currentPage, pdfDimensions, pdfInfo])

  // Initialize preview position when switching to custom mode
  useEffect(() => {
    if (
      selectedPosition === 'custom' &&
      selectedStamp &&
      pdfDimensions.width &&
      pdfDimensions.height
    ) {
      // Устанавливаем начальную позицию в центре, если она еще не установлена
      if (!previewPosition) {
        setPreviewPosition({ x: pdfDimensions.width / 2, y: pdfDimensions.height / 2 })
      }
      const pageInfo = pdfInfo?.pages[currentPage - 1]
      if (pageInfo && (!customPosition.x || !customPosition.y)) {
        setCustomPosition({ x: pageInfo.width / 2, y: pageInfo.height / 2 })
      }
    }
  }, [selectedPosition, selectedStamp, pdfDimensions, pdfInfo, currentPage])

  // Global mouse handlers for dragging
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        if (!pdfContainerRef.current) return
        const rect = pdfContainerRef.current.getBoundingClientRect()
        // previewPosition - это центр штампа (из-за transform: translate(-50%, -50%))
        const x = e.clientX - rect.left - dragOffset.x
        const y = e.clientY - rect.top - dragOffset.y

        const clampedX = Math.max(0, Math.min(x, rect.width))
        const clampedY = Math.max(0, Math.min(y, rect.height))

        setPreviewPosition({ x: clampedX, y: clampedY })

        // Конвертируем экранные координаты (центр штампа) в PDF координаты
        const pageInfo = pdfInfo?.pages[currentPage - 1]
        if (pageInfo) {
          const scaleX = pdfDimensions.width / pageInfo.width
          const scaleY = pdfDimensions.height / pageInfo.height
          // clampedX и clampedY - это центр штампа на экране
          const pdfX = clampedX / scaleX
          // PDF y идет снизу вверх, экранный y сверху вниз
          const pdfY = (pdfDimensions.height - clampedY) / scaleY
          setCustomPosition({ x: pdfX, y: pdfY })
        }
      }

      const handleMouseUp = () => {
        setIsDragging(false)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset, pdfDimensions, pdfInfo, currentPage])

  // Get stamps for current page for preview
  const currentPageStamps = placedStamps.filter(s => s.page_number === currentPage - 1)

  // Calculate preview position for stamp overlay
  const getPreviewPosition = (stamp: PlacedStamp) => {
    if (!pdfDimensions.width || !pdfDimensions.height) return {}

    const pageInfo = pdfInfo?.pages[stamp.page_number]
    if (!pageInfo) return {}

    // Calculate scale factor between PDF points and rendered pixels
    const scaleX = pdfDimensions.width / pageInfo.width
    const scaleY = pdfDimensions.height / pageInfo.height

    // Get actual stamp image size or use default
    const stampSize = stampImageSizes[stamp.stamp_image] || { width: 150, height: 50 }
    const stampWidth = stampSize.width * stamp.scale * scaleX
    const stampHeight = stampSize.height * stamp.scale * scaleY
    const margin = 20 * scaleX

    let x = 0,
      y = 0

    switch (stamp.position) {
      case 'top-left':
        x = margin
        y = margin
        break
      case 'top-center':
        x = (pdfDimensions.width - stampWidth) / 2
        y = margin
        break
      case 'top-right':
        x = pdfDimensions.width - stampWidth - margin
        y = margin
        break
      case 'center':
        x = (pdfDimensions.width - stampWidth) / 2
        y = (pdfDimensions.height - stampHeight) / 2
        break
      case 'bottom-left':
        x = margin
        y = pdfDimensions.height - stampHeight - margin
        break
      case 'bottom-center':
        x = (pdfDimensions.width - stampWidth) / 2
        y = pdfDimensions.height - stampHeight - margin
        break
      case 'bottom-right':
        x = pdfDimensions.width - stampWidth - margin
        y = pdfDimensions.height - stampHeight - margin
        break
      case 'custom':
        if (stamp.x !== undefined && stamp.y !== undefined) {
          // PDF координаты: x идет слева направо, y снизу вверх
          // Экранные координаты: x слева направо, y сверху вниз
          // stamp.x и stamp.y - это PDF координаты (центр штампа)
          const centerX = stamp.x * scaleX
          const centerY = pdfDimensions.height - stamp.y * scaleY
          // Вычисляем левый верхний угол для отображения
          x = centerX - stampWidth / 2
          y = centerY - stampHeight / 2
        }
        break
    }

    return {
      left: `${x}px`,
      top: `${y}px`,
      width: `${stampWidth}px`,
      height: `${stampHeight}px`,
    }
  }

  // Calculate preview position for selected stamp (before adding)
  const getSelectedStampPreviewPosition = () => {
    if (!selectedStamp || !pdfDimensions.width || !pdfDimensions.height) return null

    const pageInfo = pdfInfo?.pages[currentPage - 1]
    if (!pageInfo) return null

    // Calculate scale factor between PDF points and rendered pixels
    const scaleX = pdfDimensions.width / pageInfo.width
    const scaleY = pdfDimensions.height / pageInfo.height

    // Get actual stamp image size or use default
    const currentStamp = stamps.find(s => s.name === selectedStamp)
    const stampSize = currentStamp?.stamp_image
      ? stampImageSizes[currentStamp.stamp_image] || { width: 150, height: 50 }
      : { width: 150, height: 50 }
    const stampWidth = stampSize.width * scale * scaleX
    const stampHeight = stampSize.height * scale * scaleY
    const margin = 20 * scaleX

    let x = 0,
      y = 0

    switch (selectedPosition) {
      case 'top-left':
        x = margin
        y = margin
        break
      case 'top-center':
        x = (pdfDimensions.width - stampWidth) / 2
        y = margin
        break
      case 'top-right':
        x = pdfDimensions.width - stampWidth - margin
        y = margin
        break
      case 'center':
        x = (pdfDimensions.width - stampWidth) / 2
        y = (pdfDimensions.height - stampHeight) / 2
        break
      case 'bottom-left':
        x = margin
        y = pdfDimensions.height - stampHeight - margin
        break
      case 'bottom-center':
        x = (pdfDimensions.width - stampWidth) / 2
        y = pdfDimensions.height - stampHeight - margin
        break
      case 'bottom-right':
        x = pdfDimensions.width - stampWidth - margin
        y = pdfDimensions.height - stampHeight - margin
        break
      case 'custom':
        if (previewPosition) {
          // Используем тот же расчет размера, что и для других позиций
          return {
            left: `${previewPosition.x}px`,
            top: `${previewPosition.y}px`,
            width: `${stampWidth}px`,
            height: `${stampHeight}px`,
            transform: 'translate(-50%, -50%)',
          }
        }
        return null
    }

    return {
      left: `${x}px`,
      top: `${y}px`,
      width: `${stampWidth}px`,
      height: `${stampHeight}px`,
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Добавить штамп на PDF</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel - PDF preview */}
          <div className="flex-1 p-4 overflow-auto bg-gray-100">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">
                Страница {currentPage} из {pdfInfo?.page_count || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(pdfInfo?.page_count || 1, p + 1))}
                disabled={currentPage >= (pdfInfo?.page_count || 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div
              ref={pdfContainerRef}
              className="relative inline-block mx-auto cursor-crosshair"
              onClick={handleClick}
              style={{ userSelect: 'none' }}
            >
              <Document
                file={pdfUrl}
                loading={<div className="p-8 text-center">Загрузка PDF...</div>}
              >
                <Page
                  pageNumber={currentPage}
                  width={500}
                  onLoadSuccess={onPageLoadSuccess}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>

              {/* Stamp overlays for preview - already added stamps */}
              {currentPageStamps.map(stamp => (
                <div
                  key={stamp.id}
                  className="absolute pointer-events-none border-2 border-dashed border-blue-500 bg-blue-100/30 z-10"
                  style={getPreviewPosition(stamp)}
                >
                  <img
                    src={stampPreviews[stamp.stamp_name] || getFullImageUrl(stamp.stamp_image)}
                    alt={stamp.stamp_title}
                    className="w-full h-full object-contain opacity-70"
                  />
                </div>
              ))}

              {/* Preview for selected stamp before adding - for all positions */}
              {selectedStamp && getSelectedStampPreviewPosition() && (
                <div
                  className={`absolute pointer-events-none border-2 border-dashed border-green-500 bg-green-100/30 z-20 ${
                    selectedPosition === 'custom'
                      ? 'stamp-preview-draggable cursor-move bg-yellow-50/90 rounded shadow-lg pointer-events-auto'
                      : ''
                  }`}
                  style={getSelectedStampPreviewPosition()!}
                  ref={selectedPosition === 'custom' ? stampPreviewRef : undefined}
                  onMouseDown={selectedPosition === 'custom' ? handleDragStart : undefined}
                >
                  {selectedPosition === 'custom' && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-20">
                      Перетащите для изменения позиции
                    </div>
                  )}
                  {(() => {
                    const stamp = stamps.find(s => s.name === selectedStamp)
                    if (!stamp || !stamp.stamp_image) {
                      return (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          Изображение не найдено
                        </div>
                      )
                    }
                    const imageUrl = stampPreviews[stamp.name] || getFullImageUrl(stamp.stamp_image)
                    return (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className={`w-full h-full object-contain ${selectedPosition === 'custom' ? '' : 'opacity-70'}`}
                        onError={e => {
                          console.error('Failed to load preview stamp image:', imageUrl)
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent && !parent.querySelector('.error-placeholder')) {
                            const placeholder = document.createElement('div')
                            placeholder.className =
                              'error-placeholder text-center text-gray-400 text-sm py-4'
                            placeholder.textContent = 'Изображение не загружено'
                            parent.appendChild(placeholder)
                          }
                        }}
                        onLoad={e => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'block'
                          const parent = target.parentElement
                          const placeholder = parent?.querySelector('.error-placeholder')
                          if (placeholder) {
                            placeholder.remove()
                          }
                        }}
                      />
                    )
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Right panel - Controls */}
          <div className="w-80 p-4 border-l flex flex-col">
            <h3 className="font-medium mb-4">Настройки штампа</h3>

            {/* Stamp selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Штамп</label>
              <Select value={selectedStamp} onValueChange={setSelectedStamp}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите штамп" />
                </SelectTrigger>
                <SelectContent>
                  {stamps.map(stamp => (
                    <SelectItem key={stamp.name} value={stamp.name}>
                      {stamp.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Stamp preview */}
              {selectedStamp && (
                <div className="mt-2 p-2 border rounded bg-gray-50 min-h-[80px] flex items-center justify-center relative">
                  {(() => {
                    const stamp = stamps.find(s => s.name === selectedStamp)
                    if (!stamp) {
                      return (
                        <div className="text-center text-gray-400 text-sm py-4">
                          Штамп не найден
                        </div>
                      )
                    }
                    const imageUrl = stamp.stamp_image
                      ? stampPreviews[stamp.name] || getFullImageUrl(stamp.stamp_image)
                      : ''
                    return imageUrl ? (
                      <>
                        <img
                          key={imageUrl}
                          src={imageUrl}
                          alt="Preview"
                          className="max-w-full max-h-20 mx-auto"
                          onError={e => {
                            console.error('Failed to load stamp image:', imageUrl)
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent && !parent.querySelector('.preview-placeholder')) {
                              const placeholder = document.createElement('div')
                              placeholder.className =
                                'preview-placeholder text-center text-gray-400 text-sm py-4'
                              placeholder.textContent = 'Изображение не загружено'
                              parent.appendChild(placeholder)
                            }
                          }}
                          onLoad={e => {
                            // Удаляем placeholder, если он есть
                            const target = e.target as HTMLImageElement
                            const parent = target.parentElement
                            const placeholder = parent?.querySelector('.preview-placeholder')
                            if (placeholder) {
                              placeholder.remove()
                            }
                            // Показываем изображение
                            target.style.display = 'block'
                          }}
                        />
                        {!imageUrl && (
                          <div className="text-center text-gray-400 text-sm py-4">
                            URL изображения отсутствует
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center text-gray-400 text-sm py-4">
                        Изображение не загружено
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Position selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Позиция</label>
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map(pos => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPosition === 'custom' && (
                <p className="text-xs text-gray-500 mt-1">
                  <Move className="w-3 h-3 inline mr-1" />
                  Кликните на PDF или перетащите превью для выбора позиции
                </p>
              )}
            </div>

            {/* Scale - масштаб по умолчанию */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Масштаб: {scale.toFixed(1)}x ({Math.round(scale * 100)}% от оригинального размера)
              </label>
            </div>

            {/* Add button - всегда видна */}
            <div className="mb-4">
              <Button
                onClick={addStamp}
                disabled={!selectedStamp || (selectedPosition === 'custom' && !previewPosition)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить штамп
              </Button>
              {selectedPosition === 'custom' && !previewPosition && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Сначала установите позицию штампа на PDF
                </p>
              )}
            </div>

            {/* Placed stamps list */}
            <div className="flex-1 overflow-auto">
              <h4 className="font-medium mb-2 text-sm">
                Добавленные штампы ({placedStamps.length})
              </h4>
              {placedStamps.length === 0 ? (
                <p className="text-sm text-gray-500">Нет добавленных штампов</p>
              ) : (
                <div className="space-y-2">
                  {placedStamps.map(stamp => (
                    <div
                      key={stamp.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                    >
                      <div>
                        <div className="font-medium">{stamp.stamp_title}</div>
                        <div className="text-xs text-gray-500">
                          Стр. {stamp.page_number + 1} |{' '}
                          {POSITIONS.find(p => p.value === stamp.position)?.label}
                        </div>
                      </div>
                      <button
                        onClick={() => removeStamp(stamp.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={applyStamps}
            disabled={placedStamps.length === 0 || applyStampsMutation.isPending}
          >
            {applyStampsMutation.isPending ? 'Применение...' : 'Применить штампы'}
          </Button>
        </div>
      </div>
    </div>
  )
}
