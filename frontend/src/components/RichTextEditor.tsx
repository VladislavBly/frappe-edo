import { useRef, useEffect, useState } from 'react'
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import styles from './RichTextEditor.module.scss'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInitialMount = useRef(true)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    // Set initial value only on mount
    if (isInitialMount.current && editorRef.current && value) {
      editorRef.current.innerHTML = value
      isInitialMount.current = false
    }
  }, [])

  useEffect(() => {
    // Clear editor when value is reset to empty string
    if (editorRef.current && value === '' && editorRef.current.innerHTML !== '') {
      editorRef.current.innerHTML = ''
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const insertLink = () => {
    const url = window.prompt('Введите URL:')
    if (url) {
      executeCommand('createLink', url)
    }
  }

  return (
    <motion.div
      ref={containerRef}
      animate={{ scale: isFocused ? 1.005 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative border border-input rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all bg-background ${styles.editor}`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-b border-border/60 bg-slate-50/50">
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-slate-500 hover:text-slate-900 active:scale-95"
          title="Жирный (Ctrl+B)"
        >
          <Bold className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-slate-500 hover:text-slate-900 active:scale-95"
          title="Курсив (Ctrl+I)"
        >
          <Italic className="h-4 w-4" strokeWidth={2.5} />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1.5" />

        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-slate-500 hover:text-slate-900 active:scale-95"
          title="Маркированный список"
        >
          <List className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-slate-500 hover:text-slate-900 active:scale-95"
          title="Нумерованный список"
        >
          <ListOrdered className="h-4 w-4" strokeWidth={2.5} />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1.5" />

        <button
          type="button"
          onClick={insertLink}
          className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-slate-500 hover:text-slate-900 active:scale-95"
          title="Вставить ссылку (Ctrl+K)"
        >
          <LinkIcon className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="min-h-[140px] max-h-[500px] overflow-y-auto px-4 py-3.5 text-[15px] leading-relaxed focus:outline-none"
        data-placeholder={placeholder}
        style={{
          wordBreak: 'break-word',
        }}
      />
    </motion.div>
  )
}
