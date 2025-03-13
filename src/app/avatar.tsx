import Image from 'next/image'
import rien from '@/app/assets/rien.jpg'
import { info } from '@/info'
import Link from 'next/link'

export function Avatar() {
  return (
    <Link href="/" className="block rounded-full shrink-0">
      <Image
        className="rounded-full"
        alt={info.name}
        src={rien}
        width="64"
        height="64"
      />
    </Link>
  )
}
