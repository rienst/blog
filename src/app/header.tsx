import { info } from '@/info'
import { Avatar } from './avatar'
import { LowProfileLink } from './low-profile-link'

export function Header() {
  return (
    <header>
      <div className="flex gap-4 items-center">
        <Avatar />

        <div>
          <h1 className="text-lg font-semibold">
            <LowProfileLink href="/">{info.name}</LowProfileLink>
          </h1>

          <p className="text-sm">{info.description}</p>
        </div>
      </div>
    </header>
  )
}
