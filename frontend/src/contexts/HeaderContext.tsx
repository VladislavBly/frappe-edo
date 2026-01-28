import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface HeaderContextType {
  title: string
  subtitle?: string
  setHeader: (title: string, subtitle?: string) => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState<string | undefined>(undefined)

  const setHeader = (newTitle: string, newSubtitle?: string) => {
    setTitle(newTitle)
    setSubtitle(newSubtitle)
  }

  return (
    <HeaderContext.Provider value={{ title, subtitle, setHeader }}>
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeader() {
  const context = useContext(HeaderContext)
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider')
  }
  return context
}
