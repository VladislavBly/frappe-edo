import { useState, useMemo } from 'react'
import { Check, ChevronsUpDown, X, Search } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { Input } from './input'
import type { User } from '../../api/users/types'

interface UserSelectProps {
  users: User[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function UserSelect({
  users,
  value,
  onChange,
  placeholder = 'Выберите пользователя',
  disabled = false,
}: UserSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedUser = users.find(u => u.name === value)

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const searchLower = search.toLowerCase()
    return users.filter(
      u =>
        (u.full_name || '').toLowerCase().includes(searchLower) ||
        u.name.toLowerCase().includes(searchLower) ||
        (u.email || '').toLowerCase().includes(searchLower)
    )
  }, [users, search])

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        className="w-full justify-between font-normal"
        onClick={() => setOpen(!open)}
      >
        {selectedUser ? (
          <div className="flex items-center gap-2">
            {selectedUser.user_image ? (
              <img src={selectedUser.user_image} alt="" className="w-5 h-5 rounded-full" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                {(selectedUser.full_name || selectedUser.name).charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate">{selectedUser.full_name || selectedUser.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredUsers.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Пользователи не найдены
              </div>
            ) : (
              filteredUsers.map(user => (
                <div
                  key={user.name}
                  className={cn(
                    'flex items-center gap-2 px-2 py-2 cursor-pointer rounded hover:bg-gray-100',
                    value === user.name && 'bg-blue-50'
                  )}
                  onClick={() => {
                    onChange(user.name)
                    setOpen(false)
                    setSearch('')
                  }}
                >
                  <Check
                    className={cn('h-4 w-4', value === user.name ? 'opacity-100' : 'opacity-0')}
                  />
                  {user.user_image ? (
                    <img src={user.user_image} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                      {(user.full_name || user.name).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {user.full_name || user.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  )
}

interface UserMultiSelectProps {
  users: User[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  excludeUsers?: string[]
}

export function UserMultiSelect({
  users,
  value,
  onChange,
  placeholder = 'Выберите пользователей',
  disabled = false,
  excludeUsers = [],
}: UserMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const availableUsers = useMemo(() => {
    return users.filter(u => !excludeUsers.includes(u.name))
  }, [users, excludeUsers])

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return availableUsers
    const searchLower = search.toLowerCase()
    return availableUsers.filter(
      u =>
        (u.full_name || '').toLowerCase().includes(searchLower) ||
        u.name.toLowerCase().includes(searchLower) ||
        (u.email || '').toLowerCase().includes(searchLower)
    )
  }, [availableUsers, search])

  const selectedUsers = users.filter(u => value.includes(u.name))

  const toggleUser = (userName: string) => {
    if (value.includes(userName)) {
      onChange(value.filter(v => v !== userName))
    } else {
      onChange([...value, userName])
    }
  }

  const removeUser = (userName: string) => {
    onChange(value.filter(v => v !== userName))
  }

  return (
    <div className="relative">
      <div
        className={cn(
          'min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && setOpen(!open)}
      >
        {selectedUsers.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedUsers.map(user => (
              <span
                key={user.name}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs"
              >
                {user.full_name || user.name}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-blue-600"
                  onClick={e => {
                    e.stopPropagation()
                    removeUser(user.name)
                  }}
                />
              </span>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredUsers.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Пользователи не найдены
              </div>
            ) : (
              filteredUsers.map(user => (
                <div
                  key={user.name}
                  className={cn(
                    'flex items-center gap-2 px-2 py-2 cursor-pointer rounded hover:bg-gray-100',
                    value.includes(user.name) && 'bg-blue-50'
                  )}
                  onClick={() => toggleUser(user.name)}
                >
                  <input
                    type="checkbox"
                    checked={value.includes(user.name)}
                    onChange={() => {}}
                    className="rounded border-gray-300"
                  />
                  {user.user_image ? (
                    <img src={user.user_image} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                      {(user.full_name || user.name).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {user.full_name || user.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  )
}
