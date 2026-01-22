import { useEffect, useRef } from 'react'

interface TextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function TextEditor({ value, onChange, placeholder }: TextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<any>(null)

  useEffect(() => {
    if (!editorRef.current) return

    // Load Quill from Frappe
    const loadQuill = async () => {
      // Check if Quill is already loaded
      if ((window as any).Quill) {
        initializeEditor()
        return
      }

      // Load Quill CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdn.quilljs.com/1.3.7/quill.snow.css'
      document.head.appendChild(link)

      // Load Quill JS
      const script = document.createElement('script')
      script.src = 'https://cdn.quilljs.com/1.3.7/quill.js'
      script.onload = () => {
        initializeEditor()
      }
      document.head.appendChild(script)
    }

    const initializeEditor = () => {
      if (!editorRef.current || quillRef.current) return

      const Quill = (window as any).Quill
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: placeholder || 'Введите текст...',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ header: [1, 2, 3, false] }],
            ['link'],
            ['clean'],
          ],
        },
      })

      // Set initial value
      if (value) {
        quillRef.current.clipboard.dangerouslyPasteHTML(value)
      }

      // Listen for changes
      quillRef.current.on('text-change', () => {
        const html = quillRef.current.root.innerHTML
        // Don't update if only empty paragraph
        if (html === '<p><br></p>') {
          onChange('')
        } else {
          onChange(html)
        }
      })
    }

    loadQuill()

    return () => {
      if (quillRef.current) {
        quillRef.current = null
      }
    }
  }, [])

  // Update editor content when value changes externally
  useEffect(() => {
    if (quillRef.current && value === '' && quillRef.current.root.innerHTML !== '<p><br></p>') {
      quillRef.current.setText('')
    }
  }, [value])

  return (
    <div className="text-editor-wrapper">
      <div ref={editorRef} className="border rounded-md" />
      <style>{`
        .text-editor-wrapper .ql-container {
          font-family: inherit;
          font-size: 14px;
        }
        .text-editor-wrapper .ql-editor {
          min-height: 100px;
        }
        .text-editor-wrapper .ql-editor.ql-blank::before {
          color: hsl(215.4 16.3% 46.9%);
          font-style: normal;
        }
      `}</style>
    </div>
  )
}
