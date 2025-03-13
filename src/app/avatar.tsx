import Image from 'next/image'
import rien from '@/app/assets/rien.jpg'
import { info } from '@/info'

export function Avatar() {
  return (
    <Image
      className="rounded-full shrink-0"
      alt={info.name}
      src={rien}
      width="64"
      height="64"
    />
  )
}
