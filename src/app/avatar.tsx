import Image from 'next/image'
import rien from '@/app/assets/rien.jpg'

export function Avatar() {
  return (
    <Image
      className="rounded-full shrink-0"
      alt="Rien Stenekes"
      src={rien}
      width="64"
      height="64"
    />
  )
}
