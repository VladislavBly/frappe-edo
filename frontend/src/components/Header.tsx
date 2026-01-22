import { useEffect, useState } from 'react'
import { LogOut, User, FileText } from 'lucide-react'
import { api, type User as UserType } from '../lib/api'

export function Header() {
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
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="border-b bg-white shrink-0">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">EDO</h1>
            <p className="text-xs text-muted-foreground">
              Электронный документооборот
            </p>
          </div>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 hover:bg-muted rounded-lg px-3 py-2 transition-colors"
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
            <span className="text-sm font-medium hidden sm:block">
              {user?.full_name || 'Загрузка...'}
            </span>
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
                  <p className="text-sm font-medium">{user?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
