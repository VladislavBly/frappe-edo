import { memo } from 'react'
import dashboardIcon from '../assets/icons/dashboard.png'
import documentIcon from '../assets/icons/document.png'
import settingsIcon from '../assets/icons/settings.png'

// Используем путь напрямую через Frappe assets
function getIconSrc(iconPath: string, iconName: string): string {
  const imgSrc = iconPath as string
  
  // В dev режиме Vite возвращает путь вида "/src/assets/icons/dashboard.png"
  if (imgSrc.startsWith('/src/')) {
    return imgSrc
  }
  
  // В production используем прямой путь через Frappe assets
  return `/assets/edo/dist/assets/icons/${iconName}.png`
}

interface IconProps {
  name: 'dashboard' | 'document' | 'settings'
  size?: number
  className?: string
}

const iconMap = {
  dashboard: dashboardIcon,
  document: documentIcon,
  settings: settingsIcon,
}

export const Icon = memo(function Icon({ 
  name, 
  size = 20,
  className = '' 
}: IconProps) {
  const iconSrc = getIconSrc(iconMap[name], name)

  return (
    <img
      src={iconSrc}
      alt={`${name} icon`}
      width={size}
      height={size}
      className={className}
      onError={() => {
        console.error('Failed to load icon:', name, 'from:', iconSrc)
      }}
    />
  )
})
