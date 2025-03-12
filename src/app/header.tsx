import { Avatar } from './avatar'
import { LowProfileLink } from './low-profile-link'

export function Header() {
  return (
    <header>
      <div className="flex gap-4 items-center">
        <Avatar />

        <div>
          <h1 className="text-lg font-semibold">
            <LowProfileLink href="/">Rien Stenekes</LowProfileLink>
          </h1>

          <p className="text-sm">Software engineer from the Netherlands</p>
        </div>
      </div>
    </header>
  )
}
