import { useEffect, useState } from 'react'
import { Search, Bell, LogOut, User, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api, type User as UserType } from '../lib/api'
import { LanguageSwitcher } from './LanguageSwitcher'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { t } = useTranslation()
  const [user, setUser] = useState<UserType | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const userData = await api.getCurrentUser()
      setUser(userData)
    } catch (err) {
      console.error('Failed to load user:', err)
    }
  }

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch (err) {
      console.error('Failed to logout:', err)
      window.location.href = '/login'
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  }

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0">
      {/* Left - Page title */}
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Divider */}
        <div className="w-px h-8 bg-border mx-2" />

        {/* User profile */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 hover:bg-muted rounded-lg px-2 py-1.5 transition-colors"
          >
            {user?.user_image ? (
              <img
                src={user.user_image}
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                {user ? getInitials(user.full_name) : <User className="w-4 h-4" />}
              </div>
            )}
            <span className="text-sm font-medium hidden md:block max-w-32 truncate">
              {user?.full_name || t('common.loading')}
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border rounded-lg shadow-lg z-20 py-1">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium truncate">{user?.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  {user?.roles && user.roles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {user.roles
                        .filter(role => role.startsWith('EDO'))
                        .map((role) => (
                          <span
                            key={role}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              role === 'EDO Admin'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {role.replace('EDO ', '')}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('common.logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
