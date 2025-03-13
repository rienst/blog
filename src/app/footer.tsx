import { info } from '@/info'
import { LowProfileLink } from './low-profile-link'

export function Footer() {
  return (
    <footer className="flex flex-wrap gap-x-4 gap-y-2 text-center text-sm text-gray-500 dark:text-gray-400 ">
      <div>&copy; {info.name}</div>

      {Object.entries(info.links).map(([key, value]) => (
        <LowProfileLink key={key} href={value} target="_blank" rel="noreferrer">
          {key}
        </LowProfileLink>
      ))}
    </footer>
  )
}
