import { LogOut, User, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api, type User as UserType } from '../../lib/api'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface UserProfileProps {
  user: UserType | null
}

export function UserProfile({ user }: UserProfileProps) {
  const { t } = useTranslation()

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

  const primaryRole = user?.roles?.find(role => role.startsWith('EDO')) || null

  return (
    <div className="flex items-center gap-2">
      {/* Role Badge */}
      {primaryRole && (
        <Badge
          variant={primaryRole === 'EDO Admin' ? 'default' : 'secondary'}
          className="text-xs"
        >
          {primaryRole.replace('EDO ', '')}
        </Badge>
      )}

      {/* User Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 h-auto py-1.5 px-2">
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
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('common.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
