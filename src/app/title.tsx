import { PropsWithChildren } from 'react'

export function Title(props: PropsWithChildren) {
  return (
    <h1 className="text-2xl font-semibold sm:text-4xl">{props.children}</h1>
  )
}
