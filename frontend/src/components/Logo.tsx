import { memo } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
}

// Используем путь напрямую через Frappe assets
// Файл находится в public/edo_logo.png, который копируется в dist
const LOGO_PATH = '/assets/edo/dist/edo_logo.png'

export const Logo = memo(function Logo({ 
  size = 'md', 
  className = '' 
}: LogoProps) {
  return (
    <img
      src={LOGO_PATH}
      alt="EDO Logo"
      className={`${sizeClasses[size]} object-contain ${className}`}
      onError={() => {
        console.error('Failed to load logo from:', LOGO_PATH)
      }}
    />
  )
})
