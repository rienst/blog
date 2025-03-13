import { info } from '@/info'
import { LowProfileLink } from './low-profile-link'

export function Footer() {
  return (
    <footer className="flex flex-wrap gap-x-4 gap-y-2 text-center text-sm text-gray-500 dark:text-gray-400 ">
      <div>&copy; {info.name}</div>

      <LowProfileLink
        href="https://linkedin.com/in/rienstenekes"
        target="_blank"
        rel="noreferrer"
      >
        LinkedIn
      </LowProfileLink>

      <LowProfileLink
        href="https://github.com/rienst"
        target="_blank"
        rel="noreferrer"
      >
        GitHub
      </LowProfileLink>
    </footer>
  )
}
