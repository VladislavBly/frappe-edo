import { memo } from 'react'
import { HeaderTitle } from './HeaderTitle'
import { HeaderActions } from './HeaderActions'
import { useHeader } from '../../contexts/HeaderContext'
import { useCurrentUser } from '../../api/users/api'

export const Header = memo(function Header() {
  const { title, subtitle } = useHeader()
  const { data: user } = useCurrentUser()

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0">
      <HeaderTitle title={title} subtitle={subtitle} />
      <HeaderActions user={user || null} />
    </header>
  )
})
