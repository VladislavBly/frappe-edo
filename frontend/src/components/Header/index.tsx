import { useEffect, useState, memo } from 'react'
import { HeaderTitle } from './HeaderTitle'
import { HeaderActions } from './HeaderActions'
import { useHeader } from '../../contexts/HeaderContext'
import { api, type User as UserType } from '../../lib/api'

export const Header = memo(function Header() {
  const { title, subtitle } = useHeader()
  const [user, setUser] = useState<UserType | null>(null)

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

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0">
      <HeaderTitle title={title} subtitle={subtitle} />
      <HeaderActions user={user} />
    </header>
  )
})
