import { useTranslation } from 'react-i18next'
import { cn } from '../lib/utils'
import { Logo } from './Logo'
import { Icon } from './Icon'

interface SidebarProps {
  currentPage: 'dashboard' | 'documents'
  onNavigate: (page: 'dashboard' | 'documents') => void
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { t } = useTranslation()

  const navItems = [
    { id: 'dashboard' as const, label: t('navigation.dashboard'), icon: 'dashboard' as const },
    { id: 'documents' as const, label: t('navigation.documents'), icon: 'document' as const },
  ]

  return (
    <aside className="w-64 border-r bg-white flex flex-col shrink-0">
      {/* Logo - same height as header (h-14) */}
      <div className="h-14 px-4 border-b flex items-center gap-3">
        <Logo size="lg" />
        <div>
          <h1 className="font-bold text-lg leading-tight">EDO</h1>
          <p className="text-xs text-muted-foreground leading-tight">Документооборот</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors',
              currentPage === item.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Icon name={item.icon} size={48} />
            {item.label}
          </button>
        ))}

        <div className="pt-4 mt-4 border-t">
          <button className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Icon name="settings" size={48} />
            {t('common.settings')}
          </button>
        </div>
      </nav>
    </aside>
  )
}
