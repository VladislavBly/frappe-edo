import { FileText, LayoutDashboard, Settings, HelpCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../lib/utils'

interface SidebarProps {
  currentPage: 'dashboard' | 'documents'
  onNavigate: (page: 'dashboard' | 'documents') => void
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { t } = useTranslation()
  
  const navItems = [
    { id: 'dashboard' as const, label: t('navigation.dashboard'), icon: LayoutDashboard },
    { id: 'documents' as const, label: t('navigation.documents'), icon: FileText },
  ]

  return (
    <aside className="w-64 border-r bg-white flex flex-col shrink-0">
      {/* Logo - same height as header (h-14) */}
      <div className="h-14 px-4 border-b flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <FileText className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight">{t('app.name')}</h1>
          <p className="text-xs text-muted-foreground leading-tight">{t('app.subtitle')}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              currentPage === item.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}

        <div className="pt-4 mt-4 border-t">
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Settings className="w-5 h-5" />
            {t('common.settings')}
          </button>
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            {t('common.help')}
          </button>
        </div>
      </nav>
    </aside>
  )
}
