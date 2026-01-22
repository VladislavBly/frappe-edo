import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { cn } from '../lib/utils'

const languages = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'uz', label: "O'zbek" },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('i18nextLng', lang)
    setIsOpen(false)
  }

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden md:inline">
          {languages.find((l) => l.code === i18n.language)?.label || 'Русский'}
        </span>
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white border rounded-lg shadow-lg z-20 py-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={cn(
                'w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors',
                i18n.language === lang.code && 'bg-primary/10 text-primary font-medium'
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
