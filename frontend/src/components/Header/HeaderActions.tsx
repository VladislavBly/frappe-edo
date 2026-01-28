import { Search, Bell } from 'lucide-react'
import { Button } from '../ui/button'
import { LanguageSwitcher } from '../LanguageSwitcher'
import { UserProfile } from './UserProfile'
import type { User as UserType } from '../../api/users/types'

interface HeaderActionsProps {
  user: UserType | null
}

export function HeaderActions({ user }: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Search */}
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Search className="w-5 h-5" />
      </Button>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="h-9 w-9 relative">
        <Bell className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      </Button>

      {/* Language Switcher */}
      <LanguageSwitcher />

      {/* Divider */}
      <div className="w-px h-8 bg-border mx-2" />

      {/* User profile */}
      <UserProfile user={user} />
    </div>
  )
}
